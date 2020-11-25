'use strict';
const fs = require('fs');
const path = require('path');
const util = require('util');
const stream = require('stream');
const pipeline = util.promisify(stream.pipeline);

const sharp = require('sharp');
const globby = require('globby');
const imagemin = require('imagemin');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminPngquant = require('imagemin-pngquant');
const imageminSvgo = require('imagemin-svgo');
const imageminWebp = require('imagemin-webp');

const Execution = global.ExecutionClass;

class imageExecutor extends Execution {
  constructor(process) {
    super(process);
    this.finalDestination = '';
    this.options = {};
    this.endOptions = { end: 'end', msg_output: '' };
  }

  async exec(options) {
    this.options = options;
    if (typeof this.options.input === 'string') {
      this.options.input = [this.options.input];
    }
    for await (const file of globby.stream(this.options.input)) {
      await this.transformImage(file).catch(error => {
        if (this.options.failOnError) {
          this.endOptions.end = 'error';
          this.endOptions.msg_output += `${file}: ${error}\n`;
          this.endOptions.err_output = `${file}: ${error}`;
          this.end(this.endOptions);
        } else {
          this.endOptions.msg_output += `${file}: ${error}\n`;
        }
      });
    }
    this.end(this.endOptions);
  }

  async writeBufferToFile(buffer, file) {
    try {
      const fd = await fs.promises.open(file, 'w');
      await fd.write(buffer);
      await fd.close(fd);
    } catch (error) {
      throw error;
    }
  }

  qualityPNGCalculate(quality) {
    if (!quality || quality >= 90) {
      return [0.9, 1];
    } else {
      const minQualityUnits = quality / 100;
      const maxQualityUnits = minQualityUnits + 0.1;
      return [minQualityUnits, maxQualityUnits];
    }
  }

  async generateDestination(destination, outputFilePath, outputFile) {
    if (destination) {
      const outputDir = destination;
      !fs.existsSync(outputDir) && fs.mkdirSync(outputDir, { recursive: true });
      return path.join(outputDir, outputFile);
    } else {
      return path.join(outputFilePath, outputFile);
    }
  }

  async transformImage(file) {
    // Destination
    let outputFile = path.basename(file);
    let destinationFormat = path.parse(outputFile).ext.replace('.', '');
    let destinationFormatOptions = {};

    //toFormat:
    if (this.options.toFormat) {
      //string:
      if (typeof this.options.toFormat === 'string') {
        destinationFormat = this.options.toFormat;
        if (this.options.quality && !this.options.optimized) {
          destinationFormatOptions.quality = this.options.quality;
        }
        //object:
      } else if (typeof this.options.toFormat === 'object') {
        if (!this.options.toFormat.hasOwnProperty('quality') && this.options.quality)
          this.options.toFormat.quality = this.options.quality;
        if (this.options.optimized && this.options.toFormat.quality) delete this.options.toFormat.quality;
        destinationFormat = this.options.toFormat.toFormat;
        destinationFormatOptions = this.options.toFormat;
      }
    }

    outputFile = `${path.parse(outputFile).name}.${destinationFormat}`;
    const outputFilePath = path.dirname(file);
    this.finalDestination = await this.generateDestination(this.options.destination, outputFilePath, outputFile);

    // Transformation:
    let pipes = [fs.createReadStream(file)];
    const sharpStream = sharp({
      failOnError: false
    }).setMaxListeners(0);
    if (this.options.composite) pipes.push(sharpStream.composite(this.options.composite));
    if (this.options.resize) pipes.push(sharpStream.resize(this.options.resize));
    //toFormat:
    if (this.options.toFormat) {
      pipes.push(sharpStream.toFormat(destinationFormat, destinationFormatOptions));
    }

    if (this.options.rotate) pipes.push(sharpStream.rotate(this.options.rotate));
    if (this.options.flip) pipes.push(sharpStream.flip());
    if (this.options.flop) pipes.push(sharpStream.flop());
    if (this.options.flatten) pipes.push(sharpStream.flatten(this.options.flatten));
    if (this.options.negate) pipes.push(sharpStream.negate(this.options.negate));
    if (this.options.greyscale) pipes.push(sharpStream.greyscale(this.options.greyscale));
    if (this.options.sharpen) pipes.push(sharpStream.sharpen(this.options.sharpen));
    if (this.options.tint) pipes.push(sharpStream.tint(this.options.tint));
    pipes.push(fs.createWriteStream(this.finalDestination));

    // Generate
    await pipeline(...pipes);
    this.endOptions.msg_output += `${this.finalDestination}: generated.\n`;

    // Optimization
    if (this.options.optimized) {
      let _plugins = [
        imageminMozjpeg({ progressive: true, quality: this.options.quality }),
        imageminPngquant({
          strip: true,
          quality: this.qualityPNGCalculate(this.options.quality)
        }),
        imageminSvgo({
          plugins: [{ removeViewBox: false }]
        })
      ];

      if (destinationFormat.toUpperCase() === 'WEBP') {
        _plugins.push(imageminWebp({ quality: this.options.quality }));
      }

      try {
        let optimizedFileOutput = await imagemin([this.finalDestination], {
          plugins: _plugins
        });

        const fileToOptim = await fs.promises.stat(this.finalDestination);
        if (optimizedFileOutput[0].data.length >= fileToOptim.size) {
          this.endOptions.msg_output += `${this.finalDestination}: optimization discarded, size after optimization is larger, check the parameters and pay special attention to the indicated quality. (No optimized:${fileToOptim.size} / Optimized:${optimizedFileOutput[0].data.length})\n`;
        } else {
          await this.writeBufferToFile(optimizedFileOutput[0].data, this.finalDestination);
          this.endOptions.msg_output += `${this.finalDestination}: optimized (${fileToOptim.size} to ${optimizedFileOutput[0].data.length}).\n`;
        }
      } catch (error) {
        throw `optimization: ${error}`;
      }
    }
  }
}

module.exports = imageExecutor;
