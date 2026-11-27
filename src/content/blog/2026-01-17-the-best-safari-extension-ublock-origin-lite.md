---
title: "The best Safari extension: uBlock Origin Lite"
description: "Let's get rid of YouTube Shorts!"
pubDate: 2026-01-17
updateDate: 2026-11-27
tags:
  - macOS
  - iOS
  - iPadOS
  - Safari
  - uBlock Origin Lite
  - YouTube
---

The [uBlock Origin Lite](https://ublockorigin.com/) was released on the App Store in August 2025. Although it's the "Lite" version, which is not as powerful as the original, it's still one of the best things to happen in the last year, especially for users who sometimes have to use Safari as their browser, like me.

The best options for normal users who want to protect their privacy are still to use Firefox with the [user.js file](https://github.com/arkenfox/user.js/) for hardening or the more user-friendly [Brave browser](https://brave.com/). However, Safari sometimes has its own advantages, such as the battery saver. To be honest, "thanks" to its system-native status, it conserves battery power far more effectively than other third-party browsers. But this remains its sole redeeming feature. In terms of web compatibility, privacy, and extensibility, Safari undoubtedly ranks at the bottom.

Until the arrival of uBlock Origin Lite.

Those familiar with it will have long heard its reputation, while if you're encountering it for the first time, all you need to know for now is that it can magically eliminate almost all manner of irritating adverts and pop-ups, including but not limited to YouTube, X, Instagram, Facebook (yes, you won't need to pay a penny for a subscription!), and numerous other websites.

Moreover, if you couldn't care less about short videos but find yourself constantly bombarded by sites like YouTube, which seem determined to use every trick in the book to push short-form content on you, then uBlock Origin Lite is absolutely the solution for you.

It works on all Apple ecosystems, but this blog focuses on how you can set it up step by step on macOS. The process is similar for other systems, and I'm sure you can learn by analogy.

---

## Here is how this magic is achieved

First, download and install it from the [App Store](https://apps.apple.com/us/app/ublock-origin-lite/id6745342698).

![uBlock Origin Lite App Store page](/2026-01-17/ublock-origin-lite.png)

Then enable it in Safari's extension settings.

![uBlock Origin Lite Safari Extension Settings](/2026-01-17/ubol-safari-extension-settings.png)

Open the uBlock Origin Lite dashboard by clicking the icon in the toolbar and select the native rules from the **Filter lists**. If you want, you can also select your regions and languages using the filter at the bottom of the lists, but the below setting is good enough for most senarios.

![uBlock Origin Lite Native Filter Lists](/2026-01-17/ubol-native-filter-lists.png)

---

## Now for the important part

By following the steps above, we've managed to get rid of ads and most of the annoying pop-ups. But if you absolutely hate short videos like me, we'll need to take a few extra steps.

First, copy these rules by click the copy button below:

```text
! YT Desktop - Homepage and Subscriptions - Hide Shorts shelves
www.youtube.com##ytd-rich-shelf-renderer[is-shorts]
www.youtube.com##ytd-rich-section-renderer:has(ytd-rich-shelf-renderer[is-shorts])

! YT Desktop - Menu - Hide Shorts button
www.youtube.com###guide [title="Shorts"], .ytd-mini-guide-entry-renderer[title="Shorts"]

! YT Desktop - Search - Hide Shorts videos
www.youtube.com##ytd-search ytd-video-renderer:has([overlay-style="SHORTS"],a[href^="/shorts/"],[aria-label="Shorts"])

! YT Desktop - Hide Shorts shelves
www.youtube.com##ytd-reel-shelf-renderer
www.youtube.com##ytd-search grid-shelf-view-model:has(a[href^="/shorts/"])

! YT Desktop - Channels - Hide Shorts tab
www.youtube.com##[tab-title="Shorts"]

! YT Desktop - Subscriptions - Grid View
www.youtube.com##ytd-browse[page-subtype="subscriptions"] ytd-grid-video-renderer:has([overlay-style="SHORTS"],a[href^="/shorts/"])

! YT Desktop - Subscriptions - List View
www.youtube.com##ytd-browse[page-subtype="subscriptions"] ytd-video-renderer:has([overlay-style="SHORTS"],a[href^="/shorts/"])

! YT Desktop - Homepage and Subscriptions - Rich Layout
www.youtube.com##ytd-rich-item-renderer:has([overlay-style="SHORTS"],a[href^="/shorts/"])

! YT Desktop - Sidebar - Hide Shorts
www.youtube.com###related :is(ytd-compact-video-renderer,yt-lockup-view-model):has([overlay-style="SHORTS"],a[href^="/shorts/"])

! YT Desktop - History - Hide individual Shorts
www.youtube.com##ytd-browse[page-subtype="history"] ytd-video-renderer:has(a[href^="/shorts/"])

! YT Mobile - Hide Shorts menu button
m.youtube.com##ytm-pivot-bar-item-renderer:has(>.pivot-shorts)

! YT Mobile - Hide Shorts sections
m.youtube.com##:is(ytm-rich-section-renderer,grid-shelf-view-model):has(a[href^="/shorts/"])
m.youtube.com##ytm-reel-shelf-renderer

! YT Mobile - Search - Hide Shorts
m.youtube.com##ytm-search ytm-video-with-context-renderer:has(a[href^="/shorts/"])

! YT Mobile - Channels - Hide Shorts tab
m.youtube.com##[tab-title="Shorts"]

! YT Mobile - History - Hide Shorts
m.youtube.com##[tab-identifier="FEhistory"] ytm-compact-video-renderer:has(>div>a[href^="/shorts/"])
```

> These rules may change from time to time, so it's a good idea to check the [Reddit page](https://www.reddit.com/r/uBlockOrigin/wiki/solutions/youtube/) for the latest updates. Some of the rules on this page might also be outdated. If you ever find that none of the rules work, you are more than welcome to email me, and I'd be more than happy to help find a solution together!

Then, in the dashboard, go to **Custom filters > Import / Export**, paste what you just copied and click **✓Add** button. It should look similar to this after clicking:

![uBlock Origin Lite Custom Filter Lists](/2026-01-17/ubol-custom-filter-lists.png)

Then you need to quit Safari completely by pressing **cmd + Q**. This is **essential**.

Now reopen Safari, open YouTube, and savour your triumph! Those pesky adverts and short video pushes have vanished both in homepage and in search results!

Keep it in mind, this is rather like a game of cat and mouse, so perhaps one day this extension may cease to function (but it is not this day! This day we fight!). Should you wish to contribute, when encountering usage issues, you may visit [this GitHub issue](https://github.com/uBlockOrigin/uAssets/issues/30158) to help the developers identify the problem more quickly.

---

## Update

If you use Safari every day (god I hate to say that), you may have noticed that, each time the UBOL updates, its functions stop working, even if you restart Safari completely. In order to solve this problem, you need to complete the following steps.

Firstly, according to the official update logs, you need to wait a few seconds before it is fully ready. The more rules you set, the longer you will need to wait for them to take effect. I usually wait for around **10** seconds to **30** seconds after opening a new YouTube page, depending which device I'm using.

Secondly, if you feel you have waited long enough after opening a YouTube page, find the extension icon in the Safari Toolbar. Click it and change the filtering mode from the default `Optimal` to `Complete` (or any other option).

![UBOL Settings](/2026-01-17/ubol-settings.png)

Then change it back to `Optimal`. The webpage will refresh automatically and the ads and shorts will have disappeared!

---

## Bonus

To avoid being tracked by this blog, enable `Developer mode` in uBOL and add the following to the **Custom DNR rules**:

```text
---
# ||api.michifumi.de^
action:
  type: block
condition:
  requestDomains:
    - api.michifumi.de
priority: 10
---
```
