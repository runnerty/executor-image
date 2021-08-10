<p align="center">
  <a href="http://runnerty.io">
    <img height="257" src="https://runnerty.io/assets/header/logo-stroked.png">
  </a>
  <p align="center">Smart Processes Management</p>
</p>

[![NPM version][npm-image]][npm-url] [![Downloads][downloads-image]][npm-url]
<a href="#badge">
<img alt="code style: prettier" src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg">
</a>

# Executor for [Runnerty]: Image

Module for image processing, conversion and optimization.
It makes use of the [sharp] and [imagemin] (image optimization) modules.
It supports `JPG`, `PNG`, `WEBP`, `SVG`, `HEIF`, `TIFF` and `RAW` formats and allows the optimization of `JPG` (mozjpeg), `PNG` (pngquant), `WEBP` and `SVG`.

### Installation:

Through NPM

```bash
npm i @runnerty/executor-image
```

You can also add modules to your project with [runnerty-cli]

```bash
npx runnerty-cli add @runnerty/executor-image
```

This command installs the module in your project, adds example configuration in your `config.json` and creates an example plan of use.

If you have installed [runnerty-cli] globally you can include the module with this command:

```bash
rty add @runnerty/executor-image
```

### Configuration:

Add in [config.json]:

```json
{
  "id": "image_default",
  "type": "@runnerty-executor-image"
}
```

### Plan sample:

Add in [plan.json]:

```json
{
  "id": "image_default",
  "input": ["/workspace/*.png"],
  "destination": "/workspace/resized",
  "resize": { "width": 1500 }
}
```

```json
{
  "id": "image_default",
  "input": ["/workspace/*.{jpg,jpeg}"],
  "destination": "/workspace/optimized",
  "optimized": true,
  "quality": 75
}
```

```json
{
  "id": "image_default",
  "input": ["workspace/the_image.png"],
  "destination": "/workspace/transformed",
  "resize": { "height": 800 },
  "rotate": 90,
  "flip": true,
  "flop": true,
  "negate": false,
  "greyscale": false,
  "sharpen": true,
  "toFormat": "jpg",
  "optimized": true,
  "quality": 80,
  "flatten": { "background": "#2abb81" },
  "tint": "#2abb81",
  "failOnError": true
}
```

```json
{
  "id": "image_default",
  "input": ["workspace/*.png"],
  "destination": "/workspace/watermark",
  "overrideDestinationFilename": "customname",
  "destinationPrefixFilename": "pre_",
  "destinationSuffixFilename": "_sub",
  "toFormat": "webp",
  "optimized": true,
  "composite": [{ "input": "/workspace/runnerty.png", "gravity": "center", "blend": "soft-light" }]
}
```

Use parameters in [toFormat]:

```json
{
  "id": "image_default",
  "input": ["workspace/*.png"],
  "destination": "/workspace/watermark",
  "toFormat": { "toFormat": "webp", "quality": 80, "alphaQuality": 90, "lossless": false }
}
```

### Output (Process values):

- `PROCESS_EXEC_MSG_OUTPUT`: Log operations message.
- `PROCESS_EXEC_ERR_OUTPUT`: Error output message.

### Other considerations

For more information see [sharp]'s documentation.

If you enable the `failOnError` parameter, the process will stop when any error occurs transforming or optimizing an image.
This may be recommended if you are only going to work on a single image at a time.
By default its value is false.

[runnerty]: http://www.runnerty.io
[downloads-image]: https://img.shields.io/npm/dm/@runnerty/executor-image.svg
[npm-url]: https://www.npmjs.com/package/@runnerty/executor-image
[npm-image]: https://img.shields.io/npm/v/@runnerty/executor-image.svg
[sharp]: https://sharp.pixelplumbing.com
[imagemin]: https://github.com/imagemin/imagemin
[toformat]: https://sharp.pixelplumbing.com/api-output#toformat
[config.json]: http://docs.runnerty.io/config/
[plan.json]: http://docs.runnerty.io/plan/
[runnerty-cli]: https://www.npmjs.com/package/runnerty-cli
