const API_DATE = "latest";
const PRIMARY_BASE_URL = `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${API_DATE}/v1`;
const FALLBACK_BASE_URL = `https://${API_DATE}.currency-api.pages.dev/v1`;

const form = document.querySelector(".converter-form");
const btn = document.querySelector(".rate-btn");
const swapBtn = document.querySelector(".swap-btn");
const amountInput = document.querySelector(".amount input");
const msg = document.querySelector(".msg");
const fromSelectElement = document.querySelector('.custom-select[data-select="from"]');
const toSelectElement = document.querySelector('.custom-select[data-select="to"]');
const customSelects = new Map();

const formatNumber = (value) =>
  new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 6,
  }).format(value);

const setMessage = (text, isError = false) => {
  msg.innerText = text;
  msg.classList.toggle("error", isError);
};

const closeAllCustomSelects = (exceptElement = null) => {
  for (const selectInstance of customSelects.values()) {
    if (selectInstance.element !== exceptElement) {
      selectInstance.close();
    }
  }
};

const createCustomSelect = (element, { defaultValue, onChange }) => {
  const trigger = element.querySelector(".select-trigger");
  const valueLabel = element.querySelector(".select-value");
  const menu = element.querySelector(".select-menu");
  let selectedValue = defaultValue;

  const syncOptionSelection = () => {
    const options = menu.querySelectorAll(".select-option");
    for (const option of options) {
      const isSelected = option.dataset.value === selectedValue;
      option.classList.toggle("selected", isSelected);
      option.setAttribute("aria-selected", String(isSelected));
      option.tabIndex = isSelected ? 0 : -1;
    }
  };

  const focusSelectedOption = () => {
    const selectedOption = menu.querySelector(
      `.select-option[data-value="${selectedValue}"]`
    );
    selectedOption?.focus();
  };

  const positionMenu = () => {
    const card = element.closest(".container");
    if (!card) {
      return;
    }

    const cardRect = card.getBoundingClientRect();
    const triggerRect = trigger.getBoundingClientRect();
    const spacing = 8;
    const availableDown = cardRect.bottom - triggerRect.bottom - spacing;
    const availableUp = triggerRect.top - cardRect.top - spacing;
    const openUp = availableDown < 170 && availableUp > availableDown;
    const maxHeight = Math.max(
      96,
      Math.floor((openUp ? availableUp : availableDown) - 6)
    );

    element.classList.toggle("menu-up", openUp);
    menu.style.maxHeight = `${maxHeight}px`;
  };

  const open = () => {
    closeAllCustomSelects(element);
    positionMenu();
    menu.hidden = false;
    element.classList.add("open");
    trigger.setAttribute("aria-expanded", "true");
  };

  const close = () => {
    menu.hidden = true;
    element.classList.remove("open", "menu-up");
    trigger.setAttribute("aria-expanded", "false");
  };

  const setValue = (value, { silent = false, closeMenu = true } = {}) => {
    if (!countryList[value]) {
      return;
    }

    selectedValue = value;
    valueLabel.textContent = selectedValue;
    trigger.dataset.value = selectedValue;
    syncOptionSelection();

    if (!silent) {
      onChange(selectedValue);
    }

    if (closeMenu) {
      close();
    }
  };

  const optionsFragment = document.createDocumentFragment();
  for (const currCode in countryList) {
    const option = document.createElement("button");
    option.type = "button";
    option.className = "select-option";
    option.role = "option";
    option.dataset.value = currCode;
    option.textContent = currCode;
    option.setAttribute("aria-selected", "false");
    option.tabIndex = -1;
    optionsFragment.append(option);
  }
  menu.append(optionsFragment);

  valueLabel.textContent = selectedValue;
  trigger.dataset.value = selectedValue;
  syncOptionSelection();

  trigger.addEventListener("click", () => {
    if (element.classList.contains("open")) {
      close();
      return;
    }

    open();
    focusSelectedOption();
  });

  trigger.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      open();
      focusSelectedOption();
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (element.classList.contains("open")) {
        close();
      } else {
        open();
        focusSelectedOption();
      }
    } else if (event.key === "Escape") {
      close();
    }
  });

  menu.addEventListener("click", (event) => {
    const option = event.target.closest(".select-option");
    if (!option) {
      return;
    }

    setValue(option.dataset.value);
    trigger.focus();
  });

  menu.addEventListener("keydown", (event) => {
    const options = [...menu.querySelectorAll(".select-option")];
    const activeIndex = options.indexOf(document.activeElement);

    if (event.key === "Escape") {
      event.preventDefault();
      close();
      trigger.focus();
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!options.length) {
        return;
      }

      let nextIndex = activeIndex;
      if (nextIndex < 0) {
        nextIndex = 0;
      } else if (event.key === "ArrowDown") {
        nextIndex = (nextIndex + 1) % options.length;
      } else {
        nextIndex = (nextIndex - 1 + options.length) % options.length;
      }

      options[nextIndex].focus();
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      const option = document.activeElement.closest(".select-option");
      if (option) {
        event.preventDefault();
        setValue(option.dataset.value);
        trigger.focus();
      }
    }
  });

  return {
    element,
    open,
    close,
    setValue,
    getValue: () => selectedValue,
    reposition: positionMenu,
    isOpen: () => element.classList.contains("open"),
  };
};

const fetchCurrencyData = async (fromCode) => {
  const endpoint = `/currencies/${fromCode.toLowerCase()}.json`;
  const urls = [`${PRIMARY_BASE_URL}${endpoint}`, `${FALLBACK_BASE_URL}${endpoint}`];

  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      // Continue to the next source.
    }
  }

  throw new Error("All currency API sources failed.");
};

const updateFlag = (fieldName, currCode) => {
  const countryCode = countryList[currCode];
  const img = document.querySelector(`.${fieldName} img`);
  img.src = `https://flagsapi.com/${countryCode}/flat/64.png`;
  img.alt = `${currCode} flag`;
};

const updateExchangeRate = async () => {
  const fromCurrency = customSelects.get("from").getValue();
  const toCurrency = customSelects.get("to").getValue();

  let amtVal = Number.parseFloat(amountInput.value);
  if (!Number.isFinite(amtVal) || amtVal <= 0) {
    amtVal = 1;
    amountInput.value = "1";
  }

  btn.disabled = true;
  btn.innerText = "Updating...";

  try {
    const fromCode = fromCurrency.toLowerCase();
    const toCode = toCurrency.toLowerCase();
    const data = await fetchCurrencyData(fromCode);
    const rate = data[fromCode]?.[toCode];
    if (typeof rate !== "number") {
      throw new Error("Rate unavailable.");
    }

    const finalAmount = amtVal * rate;
    setMessage(
      `${formatNumber(amtVal)} ${fromCurrency} = ${formatNumber(finalAmount)} ${toCurrency}`
    );
  } catch (error) {
    setMessage("Unable to fetch exchange rate right now. Please retry.", true);
  } finally {
    btn.disabled = false;
    btn.innerText = "Get Exchange Rate";
  }
};

const fromSelect = createCustomSelect(fromSelectElement, {
  defaultValue: "USD",
  onChange: (value) => {
    updateFlag("from", value);
    updateExchangeRate();
  },
});

const toSelect = createCustomSelect(toSelectElement, {
  defaultValue: "INR",
  onChange: (value) => {
    updateFlag("to", value);
    updateExchangeRate();
  },
});

customSelects.set("from", fromSelect);
customSelects.set("to", toSelect);

updateFlag("from", fromSelect.getValue());
updateFlag("to", toSelect.getValue());

const swapCurrencies = () => {
  const fromCurrency = fromSelect.getValue();
  const toCurrency = toSelect.getValue();

  fromSelect.setValue(toCurrency, { silent: true, closeMenu: false });
  toSelect.setValue(fromCurrency, { silent: true, closeMenu: false });
  updateFlag("from", toCurrency);
  updateFlag("to", fromCurrency);
  closeAllCustomSelects();
  updateExchangeRate();
};

form.addEventListener("submit", (evt) => {
  evt.preventDefault();
  updateExchangeRate();
});

swapBtn.addEventListener("click", swapCurrencies);

document.addEventListener("pointerdown", (event) => {
  if (!event.target.closest(".custom-select")) {
    closeAllCustomSelects();
  }
});

window.addEventListener("resize", () => {
  for (const selectInstance of customSelects.values()) {
    if (selectInstance.isOpen()) {
      selectInstance.reposition();
    }
  }
});

window.addEventListener("load", () => {
  updateExchangeRate();
});
