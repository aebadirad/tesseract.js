# tesseract.js

This is a browser-based JS implementation of the Tesseract OCR project.

Quick get started guide:

Tesseract.init()

Tesseract.recognize( img, {lang: 'eng'} ).then( function (result) {console.log(result)} );

Options for init override to location of worker.js and tessdata traineddata paths:
{workerJSPath: '/relative/to/root/worker.js', tessdataPath: 'relative/to/root/tessdata/'}
