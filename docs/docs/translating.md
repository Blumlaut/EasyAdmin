# Translating EasyAdmin

> ⚠️ This Guide is outdated is missing information. If you want to help us update this guide, please open a Pull Request with your changes.


EasyAdmin supports translations, it has already been fully translated into multiple Languages, and thanks to community contributions, is being translated to many more!

If you want to try your hand at translating it yourself, follow this guide, your changes might be included in EasyAdmin's next update then!

## Forking the Repository

Before starting to translate, first we need to fork EasyAdmin, this requires a Github account, make sure you are logged in, then simply click the "Fork" button on the EasyAdmin Github Page:

![](https://blumlaut.me/s/4Fb2swGrxkLWmSo/preview)

Now that you have your own fork, you can get to editing files!

First off, download your newly forked EasyAdmin as a ZIP file:

![](https://blumlaut.me/s/fyoSaYoaXkfJo4Z/preview)

Now we extract our EasyAdmin to a folder of our liking and open the "language" folder:

![](https://blumlaut.me/s/iy5TK4DB8466HCN/preview)

## Adding a new language

Here we simply right click and copy the `en.json` file, this will be our template, we then rename it to our language, in our case we will simply rename it to `en_2.json`, please make sure you follow the ISO-639-1 standard to name your file.

![](assets/translating.gif)

Now, we simply open it with an editor of our choice and start translating it, important is that we ONLY change the areas marked in red:

![](https://blumlaut.me/s/wwXS3QrMraBTrbT/preview)

The values to the left are names which EasyAdmin will use to find the specific translates, these should not be translated!

Once you have finished your translation, open your Fork on GitHub again, open the "language" folder and select "Upload File"

![](https://blumlaut.me/s/SzkytQ6dyBj3jMX/preview)

Then, simply drag&drop your new file, now we are ready to create a Pull Request!

## Creating a pull request

Simply open the "Pull Requests" tab at the top of the page and select "New pull request", now we will have to select "base" as `Blumlaut/EasyAdmin` and compare as your fork.

![](https://blumlaut.me/s/SrjtbSynPDBJzMf/preview)

Once you've done that, simply click "Create pull request" and your Pull Request will be created! You dont have to do anything else, you will most likely recieve a response to it in the coming days.
