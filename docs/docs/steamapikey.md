# Creating a Steam API Key

When using Steam to identify players on your server, you'll need a **Steam WebAPI Key**.

---

### 📌 Important Note

You must have a **full Steam account** to get a Steam WebAPI Key. If your account is "limited" (usually because you haven't spent at least £5 on Steam), you won't be able to generate a key.  
To upgrade, simply buy any game that costs £5 or more.

---

## Step-by-Step Instructions

### 1. Go to the Steam API Key Page

Open your browser and go to:  
[https://steamcommunity.com/dev/apikey](https://steamcommunity.com/dev/apikey)

Log in with your **Steam account**.

---

### 2. Generate the API Key

- Click on the **"Register new key"** button.
- In the **"Domain Name"** field:
  - If you're hosting on a **dedicated server**, enter your server's **IP address** (without the port).
  - If you're running the server on your **own PC**, enter `localhost`.
- Read and agree to the **Terms of Use**.
- Click **Register**.

You will now see your new **Steam WebAPI Key**. Copy it.

---

### 3. Add the Key to Your Server

Open your server configuration file:

```
server.cfg
```

Look for a line that says:

```
steam_WebApiKey ""
```

If it's there, **paste your key between the quotes**.

If it's not there, **add the line manually** at the end of the file like this:

```cfg
steam_WebApiKey "YOUR_KEY_GOES_HERE"
```

**Example:**

```cfg
steam_WebApiKey "ECBB82291CEF372F0CBC66DD11D66DA5"
```

Save the file and restart your server for the changes to take effect.
