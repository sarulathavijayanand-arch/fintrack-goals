
const STORAGE_KEY = "finTrackProGoals";

const colors = [
    { ring: "#8B5CF6", background: "#F0E9FF", bar: "linear-gradient(90deg, #8B5CF6, #B49AFF)" },
    { ring: "#3B82F6", background: "#E5F1FF", bar: "linear-gradient(90deg, #3B82F6, #71B5FF)" },
    { ring: "#EC4899", background: "#FFE7F2", bar: "linear-gradient(90deg, #EC4899, #FF91BE)" },
    { ring: "#10B981", background: "#E0F8ED", bar: "linear-gradient(90deg, #10B981, #69DBB0)" },
    { ring: "#F59E0B", background: "#FFF1D6", bar: "linear-gradient(90deg, #F59E0B, #FFD16A)" },
    { ring: "#06B6D4", background: "#DDF8FC", bar: "linear-gradient(90deg, #06B6D4, #75E4F1)" }
];

const categoryIcons = {
    Travel: "✈️",
    Education: "📚",
    Technology: "💻",
    Emergency: "🛡️",
    Personal: "💖",
    Other: "🎯"
};

const quotes = [
    {
        text: "A little progress each day adds up to big results.",
        author: "Keep going"
    },
    {
        text: "Do not save what is left after spending, but spend what is left after saving.",
        author: "Warren Buffett"
    },
    {
        text: "Great things are done by a series of small things brought together.",
        author: "Vincent van Gogh"
    },
    {
        text: "Your future is created by what you do today, not tomorrow.",
        author: "Keep moving forward"
    },
    {
        text: "The secret to getting ahead is getting started.",
        author: "Mark Twain"
    },
    {
        text: "Small savings become big achievements when you stay consistent.",
        author: "Believe in your journey"
    }
];

let goals = loadGoals();
let editingGoalId = null;
let selectedGoalId = null;
let moneyMode = "deposit";
let lastQuoteIndex = -1;
let toastTimeout;

const $ = (id) => document.getElementById(id);

function loadGoals() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (saved !== null) {
            const parsed = JSON.parse(saved);

            if (Array.isArray(parsed)) {
                return parsed.filter(function (goal) {
                    return goal &&
                        typeof goal.id === "string" &&
                        typeof goal.name === "string" &&
                        Number.isFinite(Number(goal.target)) &&
                        Number.isFinite(Number(goal.saved));
                }).map(function (goal) {
                    return {
                        id: goal.id,
                        name: goal.name,
                        target: Math.max(1, Number(goal.target)),
                        saved: Math.max(0, Number(goal.saved)),
                        category: goal.category || "Other"
                    };
                });
            }
        }
    } catch (error) {
        console.error("Unable to load saved goals:", error);
    }

    return [
        {
            id: "demo-1",
            name: "Dream Vacation",
            target: 50000,
            saved: 25000,
            category: "Travel"
        },
        {
            id: "demo-2",
            name: "New Laptop",
            target: 70000,
            saved: 42000,
            category: "Technology"
        },
        {
            id: "demo-3",
            name: "Emergency Fund",
            target: 30000,
            saved: 12000,
            category: "Emergency"
        }
    ];
}

function saveGoals() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
        return true;
    } catch (error) {
        console.error("Unable to save goals:", error);
        showToast("Could not save data in this browser.");
        return false;
    }
}

function formatMoney(amount) {
    return "₹" + Number(amount).toLocaleString("en-IN", {
        maximumFractionDigits: 2
    });
}

function getProgress(goal) {
    return Math.min(100, Math.round((goal.saved / goal.target) * 100));
}

function getColor(index) {
    return colors[index % colors.length];
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
}

function showToast(message) {
    const toast = $("toast");

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimeout);

    toastTimeout = setTimeout(function () {
        toast.classList.remove("show");
    }, 2600);
}

function updateDashboard() {
    const totalSaved = goals.reduce(function (sum, goal) {
        return sum + goal.saved;
    }, 0);

    const totalTarget = goals.reduce(function (sum, goal) {
        return sum + goal.target;
    }, 0);

    const completed = goals.filter(function (goal) {
        return goal.saved >= goal.target;
    }).length;

    const remaining = goals.reduce(function (sum, goal) {
        return sum + Math.max(0, goal.target - goal.saved);
    }, 0);

    $("totalSaved").textContent = formatMoney(totalSaved);
    $("totalTarget").textContent = formatMoney(totalTarget);
    $("completedGoals").textContent = completed;

    $("completedCaption").textContent = completed === 1
        ? "One dream achieved!"
        : completed > 1
            ? "Dreams achieved!"
            : "Your first win is waiting!";

    $("remainingAmount").textContent = formatMoney(remaining);

    renderGoals();
    renderChart();
}

function renderGoals() {
    const grid = $("goalsGrid");
    const filter = $("goalFilter").value;

    let filteredGoals = goals;

    if (filter === "active") {
        filteredGoals = goals.filter(function (goal) {
            return goal.saved < goal.target;
        });
    } else if (filter === "completed") {
        filteredGoals = goals.filter(function (goal) {
            return goal.saved >= goal.target;
        });
    }

    if (filteredGoals.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-emoji">🌱</div>
                <h3>${goals.length === 0
                    ? "Start your savings journey"
                    : "No goals in this filter"}</h3>
                <p>${goals.length === 0
                    ? "Create your first goal and take one step closer to your dream."
                    : "Try another filter to see your other goals."}</p>
                ${goals.length === 0
                    ? '<button class="primary-btn" id="emptyAddGoal">＋ Create Your First Goal</button>'
                    : ""}
            </div>
        `;

        const emptyButton = $("emptyAddGoal");

        if (emptyButton) {
            emptyButton.addEventListener("click", openCreateGoal);
        }

        return;
    }

    grid.innerHTML = filteredGoals.map(function (goal) {
        const originalIndex = goals.findIndex(function (item) {
            return item.id === goal.id;
        });

        const color = getColor(originalIndex);
        const progress = getProgress(goal);
        const completed = goal.saved >= goal.target;
        const circumference = 2 * Math.PI * 49;
        const dashOffset = circumference - (progress / 100) * circumference;
        const remaining = Math.max(0, goal.target - goal.saved);

        return `
            <article class="goal-card">
                <div class="goal-top">
                    <div class="goal-title-wrap">
                        <div class="goal-emoji"
                             style="background:${color.background};color:${color.ring}">
                            ${categoryIcons[goal.category] || "🎯"}
                        </div>
                        <div>
                            <h3>${escapeHTML(goal.name)}</h3>
                            <p class="goal-category">${escapeHTML(goal.category)}</p>
                        </div>
                    </div>

                    <div class="goal-menu">
                        <button class="icon-btn edit-goal"
                                data-id="${escapeHTML(goal.id)}"
                                aria-label="Edit goal"
                                title="Edit goal">✎</button>
                        <button class="icon-btn delete-goal"
                                data-id="${escapeHTML(goal.id)}"
                                aria-label="Delete goal"
                                title="Delete goal">🗑</button>
                    </div>
                </div>

                <div class="ring-area">
                    <div class="progress-ring">
                        <svg viewBox="0 0 120 120" role="img"
                             aria-label="${progress}% goal progress">
                            <circle class="ring-track"
                                    cx="60" cy="60" r="49"></circle>
                            <circle class="ring-value"
                                    cx="60" cy="60" r="49"
                                    stroke="${color.ring}"
                                    stroke-dasharray="${circumference}"
                                    stroke-dashoffset="${dashOffset}"></circle>
                        </svg>
                        <div class="ring-center">
                            <span class="ring-percent">${progress}%</span>
                            <span class="ring-label">completed</span>
                        </div>
                    </div>
                </div>

                <div class="goal-amounts">
                    <div>
                        <p class="amount-label">AMOUNT SAVED</p>
                        <p class="amount-value">${formatMoney(goal.saved)}</p>
                    </div>
                    <div class="target-amount">
                        <p class="amount-label">TARGET</p>
                        <p class="amount-value">${formatMoney(goal.target)}</p>
                    </div>
                </div>

                <div class="goal-status ${completed ? "status-complete" : "status-active"}">
                    <span>${completed ? "🎉 Goal achieved!" : "✦ Amount remaining"}</span>
                    <span>${formatMoney(remaining)}</span>
                </div>

                <div class="goal-actions">
                    <button class="action-btn add-money-btn"
                            data-id="${escapeHTML(goal.id)}">＋ Add Money</button>
                    <button class="action-btn withdraw-btn"
                            data-id="${escapeHTML(goal.id)}">− Withdraw</button>
                </div>
            </article>
        `;
    }).join("");

    grid.querySelectorAll(".edit-goal").forEach(function (button) {
        button.addEventListener("click", function () {
            openEditGoal(button.dataset.id);
        });
    });

    grid.querySelectorAll(".delete-goal").forEach(function (button) {
        button.addEventListener("click", function () {
            deleteGoal(button.dataset.id);
        });
    });

    grid.querySelectorAll(".add-money-btn").forEach(function (button) {
        button.addEventListener("click", function () {
            openMoneyModal(button.dataset.id, "deposit");
        });
    });

    grid.querySelectorAll(".withdraw-btn").forEach(function (button) {
        button.addEventListener("click", function () {
            openMoneyModal(button.dataset.id, "withdraw");
        });
    });
}

function renderChart() {
    const chart = $("goalsChart");

    if (goals.length === 0) {
        chart.innerHTML = `
            <div class="empty-state">
                <div class="empty-emoji">📊</div>
                <h3>Your graph will appear here</h3>
                <p>Create a savings goal to see your progress.</p>
            </div>
        `;
        return;
    }

    chart.innerHTML = goals.map(function (goal, index) {
        const color = getColor(index);
        const progress = getProgress(goal);

        return `
            <div class="chart-row">
                <div class="chart-labels">
                    <span class="chart-goal-name">${escapeHTML(goal.name)}</span>
                    <span class="chart-amount">${progress}% · ${formatMoney(goal.saved)}</span>
                </div>
                <div class="chart-track"
                     role="progressbar"
                     aria-label="${escapeHTML(goal.name)}"
                     aria-valuenow="${progress}"
                     aria-valuemin="0"
                     aria-valuemax="100">
                    <div class="chart-fill"
                         style="width:${progress}%;background:${color.bar}"></div>
                </div>
            </div>
        `;
    }).join("");
}

function openModal(id) {
    const modal = $(id);
    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
}

function closeModal(id) {
    const modal = $(id);
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
}

function openCreateGoal() {
    editingGoalId = null;

    $("goalForm").reset();
    $("goalInitial").value = "0";
    $("goalModalTitle").textContent = "Create a New Goal";
    $("saveGoalBtn").textContent = "Create Goal";

    openModal("goalModal");
}

function openEditGoal(id) {
    const goal = goals.find(function (item) {
        return item.id === id;
    });

    if (!goal) {
        return;
    }

    editingGoalId = id;

    $("goalName").value = goal.name;
    $("goalTarget").value = goal.target;
    $("goalInitial").value = goal.saved;
    $("goalCategory").value = goal.category;
    $("goalModalTitle").textContent = "Edit Your Goal";
    $("saveGoalBtn").textContent = "Save Changes";

    openModal("goalModal");
}

function deleteGoal(id) {
    const goal = goals.find(function (item) {
        return item.id === id;
    });

    if (!goal) {
        return;
    }

    const confirmed = confirm(
        'Delete "' + goal.name + '"? This will remove its saved goal record.'
    );

    if (!confirmed) {
        return;
    }

    goals = goals.filter(function (item) {
        return item.id !== id;
    });

    saveGoals();
    updateDashboard();
    showToast("Goal deleted successfully.");
}

function openMoneyModal(id, mode) {
    const goal = goals.find(function (item) {
        return item.id === id;
    });

    if (!goal) {
        return;
    }

    selectedGoalId = id;
    moneyMode = mode;

    $("moneyForm").reset();
    $("moneyError").textContent = "";
    $("moneyGoalName").textContent = goal.name;
    $("moneyCurrentAmount").textContent = formatMoney(goal.saved);

    updateMoneyMode();
    openModal("moneyModal");
}

function updateMoneyMode() {
    const isDeposit = moneyMode === "deposit";

    $("moneyModalTitle").textContent = isDeposit
        ? "Add Money"
        : "Withdraw Money";

    $("moneySubmitBtn").textContent = isDeposit
        ? "Add Money"
        : "Withdraw Money";

    $("moneyHelp").textContent = isDeposit
        ? "Add money to increase your savings progress."
        : "Withdraw only the amount you have already saved.";

    $("depositTab").classList.toggle("active", isDeposit);
    $("withdrawTab").classList.toggle("active", !isDeposit);

    $("moneyAmount").value = "";
    $("moneyError").textContent = "";
}

$("goalForm").addEventListener("submit", function (event) {
    event.preventDefault();

    const name = $("goalName").value.trim();
    const target = Number($("goalTarget").value);
    const saved = Number($("goalInitial").value);
    const category = $("goalCategory").value;

    if (
        !name ||
        !Number.isFinite(target) ||
        target <= 0 ||
        !Number.isFinite(saved) ||
        saved < 0
    ) {
        showToast("Please enter valid goal details.");
        return;
    }

    if (saved > target) {
        showToast("Saved amount cannot be greater than the target.");
        return;
    }

    if (editingGoalId) {
        const goal = goals.find(function (item) {
            return item.id === editingGoalId;
        });

        if (!goal) {
            closeModal("goalModal");
            return;
        }

        goal.name = name;
        goal.target = target;
        goal.saved = saved;
        goal.category = category;

        showToast("Goal updated successfully!");
    } else {
        goals.push({
            id: Date.now().toString() + Math.random().toString(16).slice(2),
            name: name,
            target: target,
            saved: saved,
            category: category
        });

        showToast("Your new goal has been created!");
    }

    saveGoals();
    updateDashboard();
    closeModal("goalModal");
});

$("depositTab").addEventListener("click", function () {
    moneyMode = "deposit";
    updateMoneyMode();
});

$("withdrawTab").addEventListener("click", function () {
    moneyMode = "withdraw";
    updateMoneyMode();
});

$("moneyForm").addEventListener("submit", function (event) {
    event.preventDefault();

    const goal = goals.find(function (item) {
        return item.id === selectedGoalId;
    });

    const amount = Number($("moneyAmount").value);

    if (!goal) {
        $("moneyError").textContent = "Goal not found. Please try again.";
        return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
        $("moneyError").textContent = "Enter an amount greater than zero.";
        return;
    }

    if (moneyMode === "withdraw" && amount > goal.saved) {
        $("moneyError").textContent =
            "You cannot withdraw more than your saved amount.";
        return;
    }

    if (moneyMode === "deposit" && amount > goal.target - goal.saved) {
        $("moneyError").textContent =
            "This amount exceeds your remaining target of " +
            formatMoney(goal.target - goal.saved) + ".";
        return;
    }

    if (moneyMode === "deposit") {
        goal.saved = Math.round((goal.saved + amount) * 100) / 100;
    } else {
        goal.saved = Math.round((goal.saved - amount) * 100) / 100;
    }

    saveGoals();
    updateDashboard();
    closeModal("moneyModal");

    if (goal.saved >= goal.target) {
        showToast("Amazing! You achieved your savings goal! 🎉");
    } else if (moneyMode === "deposit") {
        showToast(formatMoney(amount) + " added to " + goal.name + "!");
    } else {
        showToast(formatMoney(amount) + " withdrawn from " + goal.name + ".");
    }
});

function showRandomQuote() {
    let index = Math.floor(Math.random() * quotes.length);

    if (quotes.length > 1) {
        while (index === lastQuoteIndex) {
            index = Math.floor(Math.random() * quotes.length);
        }
    }

    lastQuoteIndex = index;

    $("quoteText").textContent = '"' + quotes[index].text + '"';
    $("quoteAuthor").textContent = "— " + quotes[index].author;
}

$("addGoalBtn").addEventListener("click", openCreateGoal);
$("goalFilter").addEventListener("change", renderGoals);
$("newQuoteBtn").addEventListener("click", showRandomQuote);

document.querySelectorAll("[data-close]").forEach(function (button) {
    button.addEventListener("click", function () {
        closeModal(button.dataset.close);
    });
});

document.querySelectorAll(".modal").forEach(function (modal) {
    modal.addEventListener("click", function (event) {
        if (event.target === modal) {
            closeModal(modal.id);
        }
    });
});

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        closeModal("goalModal");
        closeModal("moneyModal");
    }
});

showRandomQuote();
updateDashboard();
