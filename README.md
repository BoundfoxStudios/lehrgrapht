# LehrGrapht

LehrGrapht is a simple math plotter Word add-in targeting teachers using the FunkFix macro, that is not available with macOS anymore.

## Development

### Environment setup

There are two ways to develop the add-in:

1. Develop without Word integration (e.g., to update how plots are rendered, etc.).
2. Develop with Word integration.

Please read the following sections depending on your needs.

#### Develop the add-in without Word integration

If you're not developing on the Word integration, you can run the add-in in the web.
There's nothing special you need to do, just run `npm start` and you're good to go!

#### Develop the add-in with Word integration

If you're developing on the Word integration, you need to run the add-in in Word.
Word requires SSL to load the add-in.

Microsoft provides a way to generate a certificate using `office-addin-dev-certs`.
Run `npx office-addin-dev-certs install --machine` to install the office add-in dev certificates.

Then, create a file `.env.local` (you can just copy `.env` and rename it) and change the following variables:

- `LEHRGRAPHT_SSL`: Set to `true` to enable SSL.
- `LEHRGRAPHT_SSL_KEY`: Set to the path of your SSL key file provided by `office-addin-dev-certs`.
- `LEHRGRAPHT_SSL_CERT`: Set to the path of your SSL certificate file provided by `office-addin-dev-certs`.

Now, you run `npm start` to start the development server.
Make sure, it binds to `https` on port `4200`.

Finally, you can run `npm run start:office`.
This will open Word and load the add-in.

When you're done, run `npm run stop:office`.
