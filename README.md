# Signature Pad — Appsmith Custom Widget

A customizable, theme-aware signature capture widget for [Appsmith](https://www.appsmith.com/). Supports mouse, touch and stylus input, clear/confirm actions, and PNG export using the Appsmith widget model.

> Uses [signature_pad](https://github.com/szimek/signature_pad) v4.1.7. This is an Appsmith integration and user interface, not a new drawing engine.

## Features

- Dynamic Appsmith theme integration
- Responsive canvas with stroke preservation on resize
- Customizable interface text using Default Model
- Clear and confirm actions
- Captured signature as a PNG data URL
- Custom event: onConfirm
- Transparent outer widget area

## Files

| File | Appsmith editor |
| --- | --- |
| [src/widget.html](src/widget.html) | Custom Widget → HTML |
| [src/widget.css](src/widget.css) | Custom Widget → CSS |
| [src/widget.js](src/widget.js) | Custom Widget → JavaScript |
| [src/default-model.json](src/default-model.json) | Custom Widget → Default Model |

## Installation

1. Create a new Appsmith application, or use a separate demo application.
2. Add a **Custom Widget**.
3. Paste each source file into the corresponding editor.
4. Name the widget **SignatureWidget** (or adapt the expressions below).
5. Configure the widget event **onConfirm** if you need an additional Appsmith action.
6. Draw a signature and click **Confirm Signature**.

This code runs inside Appsmith Custom Widgets, not as a standalone HTML document. The JavaScript imports Signature Pad from jsDelivr, which requires network access.

## Preview in an Appsmith Image Widget

Set the **Image** property to:

    {{SignatureWidget.model.signature}}

## Download the captured PNG

Add a Button Widget. For **onClick → Execute JS**, use:

    {{download(SignatureWidget.model.signature, "signature.png", "image/png")}}

For **Disabled**, use:

    {{!SignatureWidget.model.signature}}

## Default Model

| Key | Description |
| --- | --- |
| title | Signature card title |
| subtitle | Instructions below title |
| placeholder | Empty canvas prompt |
| confirmText | Confirmation button label |
| successMessage | Local confirmation message |
| signature | Captured PNG data URL, null until confirmation |

The output is a full PNG data URL, not raw Base64. The onConfirm event also receives the signature as event data.

## Live demo

**[Open the live demo](https://criscuolo-online21.appsmith.com/app/my-first-application/page1-6ad755c89b862f4749aff8cd?embed=true&environment=production)**

The demo includes a Signature Pad and demonstrates how to capture and download a PNG. For best results, use a fictional signature when testing.

To submit this as a community template, publish a standalone demonstration app without any corporate data, credentials or production datasources. Enable public access and forking.

## Security

A hand-drawn signature image is not by itself a legally verified electronic-signature workflow. This widget does not provide identity verification, audit trails, tamper evidence or persistent storage. Signatures may be sensitive personal data. Protect stored signatures appropriately. The example does not send signatures to external APIs; only the Signature Pad dependency is loaded from a public CDN.

## Attribution

This project integrates the [signature_pad](https://github.com/szimek/signature_pad) library by Szymon Nowak and contributors. Refer to the upstream project for its license.

## License

No license has been applied yet. Choose one once you confirm you have the rights to distribute this widget.
