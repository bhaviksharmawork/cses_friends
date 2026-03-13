# 🧑‍💻 CSES Friends Solver

A Chrome Extension (Manifest V3) that shows **which of your friends have solved the currently opened CSES problem**.

When you visit any CSES problem page, a styled box appears at the top showing:
- ✅ **Green check** — friend solved it
- ❌ **Red cross** — friend hasn't solved it

---

## ✨ Features

- **Auto-detects** the problem ID from the URL
- **Fetches** each friend's solved problems from their CSES profile
- **Caches** results for 1 hour to avoid repeated requests
- **Parallel fetching** for fast loading
- **Sorted results** — solved friends appear first
- **Clickable profile links** for each friend
- **Dark-themed UI** with smooth animations

---

## 📦 Installation

### 1. Clone the Repository

Make sure to name the folder cses-friends-extension in which the repo is being cloned (to avoid manifest-issues)

```bash[
git clone https://github.com/YOUR_USERNAME/cses-friends-extension.git](https://github.com/bhaviksharmawork/cses_friends.git)
```

### 2. Load in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **"Load unpacked"**
4. Select the `cses-friends-extension` folder you just cloned.
5. The extension icon should appear in your toolbar

### 3. Pin the Extension (Optional)

Click the **puzzle icon** (🧩) in the Chrome toolbar → click the **pin** next to "CSES Friends Solver" for easy access.

---

## 🚀 Usage

### Add Friends

1. Click the **CSES Friends Solver** extension icon in the toolbar
2. Enter a **display name** (e.g., `John`) and their **CSES User ID** (e.g., `264530`)
3. Click **Add**

> **Finding a CSES User ID:**  
> Go to your friend's CSES profile → the number in the URL is their ID  
> Example: `https://cses.fi/problemset/user/264530/` → ID is **264530**

### View Results

1. Navigate to any CSES problem page, e.g., [https://cses.fi/problemset/task/1068](https://cses.fi/problemset/task/1068)
2. A styled box will appear at the top of the page showing which friends have solved it

### Remove Friends

Click the **✕** button next to a friend's name in the popup to remove them.

---

## ⚠️ Requirements

- You must be **logged into CSES** in Chrome for the extension to work (CSES requires authentication to view user statistics)
- Friends must have a **public CSES profile** with visible statistics

---

## 📁 Project Structure

```
cses-friends-extension/
├── manifest.json    # Manifest V3 configuration
├── content.js       # Injected script on CSES problem pages
├── popup.html       # Extension popup UI
├── popup.js         # Popup logic (add/remove friends)
├── popup.css        # Dark-themed popup styles
├── icon48.png       # Toolbar icon
├── icon128.png      # Extension store icon
└── README.md        # This file
```

---

## 🛠️ How It Works

1. **Content Script** (`content.js`) runs on pages matching `https://cses.fi/problemset/task/*`
2. Extracts the **problem ID** from the URL
3. Reads **friend list** from `chrome.storage.sync`
4. For each friend, fetches `https://cses.fi/problemset/user/{userId}/`
5. Parses the HTML to find solved problems (links with class `task-score icon full`)
6. Displays results in a **floating UI box** injected into the page
7. Caches each user's solved set in `chrome.storage.local` for **1 hour**

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/awesome-feature`)
3. Commit your changes (`git commit -m 'Add awesome feature'`)
4. Push to the branch (`git push origin feature/awesome-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
