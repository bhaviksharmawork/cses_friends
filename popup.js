(function () {
  "use strict";

  const listEl = document.getElementById("friend-list");
  const nameInput = document.getElementById("name-input");
  const idInput = document.getElementById("id-input");
  const addBtn = document.getElementById("add-btn");
  const toastEl = document.getElementById("toast");

  let toastTimer = null;

  /* ── Toast helper ──────────────────────────────────────────────── */
  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2000);
  }

  /* ── Render the friend list ────────────────────────────────────── */
  function render(friends) {
    listEl.innerHTML = "";

    if (friends.length === 0) {
      listEl.innerHTML =
        '<li class="empty-state">No friends yet — add one above!</li>';
      return;
    }

    friends.forEach((friend) => {
      const li = document.createElement("li");
      li.className = "friend-item";
      li.innerHTML = `
        <span class="name">
          ${friend.name}
          <span class="user-id">#${friend.id}</span>
        </span>
        <button class="remove-btn" data-id="${friend.id}" title="Remove">✕</button>
      `;
      listEl.appendChild(li);
    });
  }

  /* ── Load friends from storage ─────────────────────────────────── */
  async function loadFriends() {
    const { friends = [] } = await chrome.storage.sync.get("friends");
    render(friends);
    return friends;
  }

  /* ── Save friends to storage ───────────────────────────────────── */
  async function saveFriends(friends) {
    await chrome.storage.sync.set({ friends });
  }

  /* ── Add a friend ──────────────────────────────────────────────── */
  async function addFriend() {
    const name = nameInput.value.trim();
    const id = idInput.value.trim();

    if (!id) {
      showToast("Please enter a CSES User ID");
      return;
    }

    if (!/^\d+$/.test(id)) {
      showToast("User ID must be a number");
      return;
    }

    const friends = await loadFriends();

    if (friends.some((f) => f.id === id)) {
      showToast(`User #${id} is already in your list`);
      return;
    }

    friends.push({ id, name: name || `User ${id}` });
    await saveFriends(friends);
    render(friends);
    nameInput.value = "";
    idInput.value = "";
    showToast(`Added ${name || `User ${id}`}`);
  }

  /* ── Remove a friend ───────────────────────────────────────────── */
  async function removeFriend(id) {
    let friends = await loadFriends();
    const removed = friends.find((f) => f.id === id);
    friends = friends.filter((f) => f.id !== id);
    await saveFriends(friends);
    render(friends);
    showToast(`Removed ${removed ? removed.name : `#${id}`}`);
  }

  /* ── Event listeners ───────────────────────────────────────────── */
  addBtn.addEventListener("click", addFriend);

  idInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addFriend();
  });

  nameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") idInput.focus();
  });

  listEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".remove-btn");
    if (btn) removeFriend(btn.dataset.id);
  });

  /* ── Init ───────────────────────────────────────────────────────── */
  loadFriends();
})();
