# HIRO

Hiro is the code that drives [MozVR.com](http://mozvr.com), a "VR website about VR websites" from Mozilla Research.


## Development

To hack on the HIRO source go to your command line:

* `git clone https://github.com/MozVR/HIRO.git`
* `npm install`
* `npm install gulp -g`
* `gulp`
* Open [http://localhost:8080](http://localhost:8080) in your browser

Fork and clone the repo, and then run `npm install` in the command-line utility of your preference from your new local HIRO directory.

### Twitter API Keys

A Twitter "tweet cloud" is created in the [`express` Gulp task](gulpfile.js), which requires Twitter API keys. Follow these steps to make that work locally:

1. Register your app at https://apps.twitter.com/app/new
2. Load [https://apps.twitter.com/app/`<app_id>`/keys](https://apps.twitter.com/app/<app_id>/keys)
3. Take note of the "Consumer Key" and "Consumer Secret" in the "Application Settings" section.
4. Scroll to the "Your Access Token" and press the "Create my access token" button.
5. Create the file for the Twitter API keys (copied from `twitter.js.dist`):

        cp appKeys/twitter.js{.dist,}

6. Open the `appKeys/twitter.js` file and fill in the blanks.


## Credits

Hiro was created by:

* [Casey Yee](https://twitter.com/whoyee)
* [Josh Carpenter](https://twitter.com/joshcarpenter)
* [Diego Marcos](https://twitter.com/dmarcos)
* [Matthew Claypotch](https://twitter.com/potch)
* [Vladimir Vukicevic](https://twitter.com/vvuk)

With special thanks to:

* [Ricardo Cabello](https://twitter.com/mrdoob)
