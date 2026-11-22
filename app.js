/**
 * app.js  –  Interactive To-Do List with LocalStorage
 * Project 2  |  InternCircle Fullstack Web Development
 *
 * Architecture:
 *  - Single source of truth: the `tasks` array.
 *  - Every mutation calls save() then render().
 *  - render() rebuilds the list from scratch each time.
 *  - localStorage persists data across page reloads.
 */

/* ============================================================
   STATE
   ============================================================ */

/** @type {{ id: number, text: string, done: boolean }[]} */
var tasks = load();          // load persisted data on start-up

/** Currently active filter: 'all' | 'active' | 'done' */
var currentFilter = "all";

/* ============================================================
   DOM REFERENCES
   ============================================================ */
var form      = document.getElementById("form");
var input     = document.getElementById("text");
var list      = document.getElementById("list");
var countEl   = document.getElementById("count");
var emptyEl   = document.getElementById("empty");
var clearBtn  = document.getElementById("clear-btn");

/* ============================================================
   STORAGE  –  save() / load()
   ============================================================ */

/**
 * Persist the tasks array to localStorage.
 * JSON.stringify converts the array to a plain string.
 */
function save() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

/**
 * Read and parse the tasks array from localStorage.
 * The try/catch ensures corrupted or missing data never
 * crashes the app — it simply starts with an empty list.
 *
 * @returns {{ id: number, text: string, done: boolean }[]}
 */
function load() {
  try {
    return JSON.parse(localStorage.getItem("tasks")) || [];
  } catch (e) {
    console.warn("localStorage data was corrupted; starting fresh.", e);
    return [];
  }
}

/* ============================================================
   RENDER
   ============================================================ */

/**
 * Rebuild the entire task list from the current state.
 * Called after every change so the UI always matches the array.
 */
function render() {
  // Apply filter to decide which tasks to show
  var visible = tasks.filter(function (t) {
    if (currentFilter === "active") return !t.done;
    if (currentFilter === "done")   return  t.done;
    return true; // 'all'
  });

  // Clear the list
  list.innerHTML = "";

  // Show/hide empty-state message
  emptyEl.hidden = visible.length > 0;

  // Build one <li> per visible task
  visible.forEach(function (t) {
    var li = document.createElement("li");
    li.dataset.id = t.id;
    if (t.done) li.classList.add("done");

    // --- Checkbox (toggle done) ---
    var checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-checkbox";
    checkbox.checked = t.done;
    checkbox.setAttribute("aria-label", "Mark task complete");
    checkbox.dataset.action = "toggle";

    // --- Task text (textContent is safe — no HTML injection) ---
    var span = document.createElement("span");
    span.className = "task-text";
    span.textContent = t.text;   // ✅ textContent, NOT innerHTML

    // --- Delete button ---
    var del = document.createElement("button");
    del.className = "btn-delete";
    del.textContent = "🗑";
    del.setAttribute("aria-label", "Delete task");
    del.dataset.action = "delete";
    del.title = "Delete task";

    li.append(checkbox, span, del);
    list.append(li);
  });

  // Update remaining-tasks counter (always counts from full array)
  var remaining = tasks.filter(function (t) { return !t.done; }).length;
  countEl.textContent = remaining + (remaining === 1 ? " left" : " left");
}

/* ============================================================
   ADD TASK
   ============================================================ */

form.addEventListener("submit", function (e) {
  e.preventDefault();                      // stop page reload

  var text = input.value.trim();
  if (!text) return;                       // reject empty input

  // Create a new task object and push it onto the array
  tasks.push({ id: Date.now(), text: text, done: false });

  input.value = "";                        // clear the field
  input.focus();

  save();
  render();
});

/* ============================================================
   COMPLETE & DELETE  (event delegation)
   ============================================================ */

/**
 * One click listener on the <ul> handles both toggle and delete
 * for every task item — no need to attach per-item listeners.
 */
list.addEventListener("click", function (e) {
  var action = e.target.dataset.action;
  if (!action) return;                     // click was on the <li> itself

  // Walk up to find the parent <li> and read its id
  var li = e.target.closest("li");
  if (!li) return;
  var id = Number(li.dataset.id);

  if (action === "delete") {
    // Remove matching task from the array
    tasks = tasks.filter(function (t) { return t.id !== id; });
  }

  if (action === "toggle") {
    // Flip the done flag
    tasks.forEach(function (t) {
      if (t.id === id) t.done = !t.done;
    });
  }

  save();
  render();
});

/* ============================================================
   FILTERS
   ============================================================ */

document.querySelector(".filters").addEventListener("click", function (e) {
  if (!e.target.classList.contains("filter-btn")) return;

  // Update active button styling
  document.querySelectorAll(".filter-btn").forEach(function (btn) {
    btn.classList.remove("active");
  });
  e.target.classList.add("active");

  // Update state and re-render
  currentFilter = e.target.dataset.filter;
  render();
});

/* ============================================================
   CLEAR COMPLETED
   ============================================================ */

clearBtn.addEventListener("click", function () {
  tasks = tasks.filter(function (t) { return !t.done; });
  save();
  render();
});

/* ============================================================
   KEYBOARD SHORTCUT  –  Enter key on input (already handled
   by form submit, included for clarity)
   ============================================================ */

input.addEventListener("keydown", function (e) {
  // Enter is already handled by the form's submit event.
  // This block is left as a demonstration of keydown handling.
  if (e.key === "Enter") {
    // form submit fires naturally; nothing extra needed.
  }
});

/* ============================================================
   INITIAL RENDER
   ============================================================ */
render();  // paint the list from whatever was loaded from localStorage
