---
title: "How to Remove EXIF Metadata from Images on macOS"
description: "A comprehensive guide to protecting your privacy by scrubbing EXIF data using ExifTool and Automator"
pubDate: 2026-02-04
tags:
  - macOS
  - ExifTool
  - Automator
  - Anonymity
---

Have you ever considered that your photo might contain more information than you could imagine? The information contained within a photo or image extends far beyond what meets the eye, and a lot of that data leaks through EXIF.

[EXIF data](https://en.wikipedia.org/wiki/Exif) (Exchangeable Image File Format), is metadata embedded in digital images and videos that records detailed technical and contextual information about how and when the media was created. It can contain camera and equipment details, shooting settings, temporal information, geolocation data, image characteristics, software and processing info, copyright and ownership, and so on, you will be surprised how much metadata can be embedded into a single image.

If such photos or images are only sitting on your local hard drive, it's not a big deal. But right after you want to share them on the internet, such as posting them on your personal blog or social media, that's where bad things can happen. Although most major social media platforms, like Instagram or X, automatically strip EXIF data when you upload, that also means they can access your metadata, refine your user profile to deliver targeted advertising, or sell your personal information to third parties if they want to (and trust me, they will).

The worst situation is when you send an image to a forum, a comment section, or an online public storage service that most likely doesn't have the functionality to scrub metadata and allows everyone to download the original file. Then you are in big trouble. Strangers can use this information to track you to your workplace, the parks where you feed pigeons, or even to your home. Just imagine how scary that would be.

That's why you need to make sure every piece of data inside a photo or image is wiped out before it reaches the internet. This blog will guide you on how to easily scrub all the EXIF metadata from an image on macOS, using [ExifTool by Phil Harvey](https://exiftool.org/) and Automator. By the end of this tutorial, you will be able to scrub an image with just one click.

![exiftool quick action](/exiftool-quick-action.png)

---

## Step 0: Install ExifTool

```bash
brew install exiftool
```

---

## Step 1: Find and Open Automator

Press **Cmd + Space** and type `Automator`, then hit **Enter**.

Select **New Document**.

Choose **Quick Action** as the document type and click **Choose**.

---

## Step 2: Configure the Inputs

At the very top of the workflow area, set the following:

- **Workflow receives current:** `image files`
- **in:** `Finder`

---

## Step 3: Add the Shell Script

In the search bar on the left, type "**Run Shell Script**".

Drag that action into the main workflow area on the right.

Change **Pass input:** to `as arguments`.

Clear out the default text and paste the following script:

```bash
EXIFTOOL="/usr/local/bin/exiftool"

for f in "$@"
do
    # 1. Strip all metadata in-place
    $EXIFTOOL -all= -overwrite_original "$f"
    
    # 2. Extract remaining info for the pop-up
    echo "--- FILE: $(basename "$f") ---"
    $EXIFTOOL "$f"
    echo "" 
done
```

**Warning:** I recommend changing the first line that sets the `EXIFTOOL` path to the path shown by `which exiftool` in Terminal. This path may vary depending on the macOS version or hardware.

---

## Step 4: Add the Display Notification

Since a shell script runs in the background, you won't see the output unless we pipe it to a window.

In the search bar on the left, type "**Set Value of Variable**". Drag it under your script.

Click the "**Variable:**" dropdown, select **New Variable...**, and name it `metadata_output`.

Now, search for "**Ask for Confirmation**" and drag it to the bottom.

Drag the Variable named `metadata_output` in the Message box.

---

## Step 5: Save and Run

Now it should look like this:

![exiftool automator](/exiftool-automator.png)

**Cmd + S** to save the file.

Name it exactly what you want to see in your right-click menu, for example: `Clean img metadata`

**Test it:**

1. Go to any folder in Finder.
2. Right-click an image that you already have a backup copy.
3. Go to **Quick Actions** > **Clean img metadata**

A dialog box will appear showing you the "cleaned" metadata (which should now only show basic file system properties like file size and format like below).

![exiftool quick action sample result](/exiftool-quick-action-sample-result.png)

You can now upload this image to the internet without any concerns.

---

## A Little Bit More

You can find your saved Quick Action file at this path: `~/Library/Services/`

**How to get there quickly:**

1. Open Finder.
2. Press **Cmd + Shift + G** (Go to Folder).
3. Paste `~/Library/Services/` and hit **Enter**.

You will see a file named `*.workflow`.

If you ever want to change the name that appears in your right-click menu, simply rename the file inside that Services folder. To delete the Quick Action, just move that file to the Trash.
