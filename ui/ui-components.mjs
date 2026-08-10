import { AuthenticationStatus } from "../core/config.mjs";
import { SVG_ICONS } from "./svg-icons.mjs";

export const togglePassword = (inputElement, btnElement) => {
    if (inputElement.type === 'password') {
        inputElement.type = 'text';
        btnElement.innerHTML = SVG_ICONS.EYE_OPENED;
    } else {
        inputElement.type = 'password';
        btnElement.innerHTML = SVG_ICONS.EYE_CLOSED;
    }
};

export const cancelButton = (onclickFunction) => {
    const button = document.createElement('button');
    button.className = "inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors";
    button.textContent = 'Cancel';
    button.onclick = onclickFunction;
    return button;
}

export const setCheckCredentials = (btnElement, state) => {
    if (state === AuthenticationStatus.AVAILABLE) {
        btnElement.disabled = false;
        const availableStyle = "inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors";
        btnElement.className = availableStyle;
        btnElement.innerHTML = `
            ${SVG_ICONS.VERIFICATION}
            Check Authorization
        `;
    } else if (state === AuthenticationStatus.PROCESSING) {
        const processingStyle = "inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-gray-700 bg-gray-100 transition-colors";
        btnElement.className = processingStyle;
        btnElement.innerHTML = `
            ${SVG_ICONS.LOAD("#767676")}
            Validating
        `;
        btnElement.disabled = true;
    } else {
        if (state === AuthenticationStatus.SUCCEED) {
            const succeedStyle = "inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-green-700 bg-green-100 transition-colors";
            btnElement.className = succeedStyle;
            btnElement.textContent = 'Authorized!';
        } else {
            const failedStyle = "inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-red-700 bg-red-100 transition-colors";
            btnElement.className = failedStyle;
            btnElement.textContent = 'Denied :(';
        }
        btnElement.disabled = true;
    }
}

const copyToClipboard = async (text) => {
    try {
        await navigator.clipboard.writeText(text);
    } catch (error) {
        console.error("Copy to clipboard failed: ", error);
    }
}

export const recipientsOrderedList = (recipients, onClearCallback) => {
    const list = document.createElement('ol');
    list.className = "list-decimal list-inside text-sm text-gray-700 mb-4 max-h-32 overflow-y-auto";

    recipients.forEach(recipient => {
        const listItem = document.createElement('li');
        listItem.textContent = recipient;
        list.appendChild(listItem);
    });

    const buttonContainer = document.createElement('div');
    buttonContainer.className = "flex space-x-3";

    const clipboard = document.createElement('button');
    clipboard.className = "inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500";
    clipboard.type = 'button';
    clipboard.innerHTML = `
        ${SVG_ICONS.CLIPBOARD}
        Copy
    `;
    clipboard.onclick = async () => {
        const text = recipients.join('\n');
        await copyToClipboard(text);

        const originalInnerHTML = clipboard.innerHTML;
        clipboard.innerHTML = `
            ${SVG_ICONS.CHECK}
            Copied!
        `;
        setTimeout(() => clipboard.innerHTML = originalInnerHTML, 2000);
    }

    const clear = document.createElement('button');
    clear.type = 'button';
    clear.className = "inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500";
    clear.innerHTML = `
        ${SVG_ICONS.CLEAR}
        Clear
    `;

    clear.onclick = onClearCallback;

    buttonContainer.appendChild(clipboard);
    buttonContainer.append(clear);

    return { list, buttonContainer };
}

export const newVariablePopUpAlert = (onCancelCallback) => {
    const cancelBtn = cancelButton(onCancelCallback);
    const htmlString = `
        <div id="new-variable-container" class="text-center py-4">
            <h2 class="text-xl font-bold text-gray-900">Setting a New Recipients Variable</h2>
            <p class="mt-2 text-sm text-gray-500">Define your new recipients variable</p>
            <form id="new-variable-form" class="p-6 sm:p-10 space-y-8">
                <label for="new-variable-input" class="block text-sm font-medium text-gray-700">Variable Name:</label>
                <input type="text" id="new-variable-input" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 border bg-gray-50">
                <p>As <span id="new-variable-naming" class="text-cyan-600 font-semibold">undefined</span></p>
                <div id="popup-actions-slot" class="mt-6 flex justify-end space-x-3 pt-4 border-t border-gray-100">
                    <button disabled type="submit" id="create-new-variable-btn" class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-300 cursor-not-allowed transition-colors">Continue</button>
                </div>
            </form>
        </div>
    `;

    const template = document.createElement('template');
    template.innerHTML = htmlString.trim();
    const container = template.content.firstElementChild;

    const actionsSlot = container.querySelector('#popup-actions-slot');
    actionsSlot.prepend(cancelBtn);

    return container;
};

export const appendVariableElementToList = (listElement, readableVariableName, kebabCaseVariableName) => {
    const li = document.createElement('li');
    li.innerHTML = `${readableVariableName} (as <span class="text-cyan-600 font-semibold">${kebabCaseVariableName}</span>)`;
    listElement.appendChild(li);
};

export const buildVariableSelectionUI = (variablesMap, onSelectVariable, onCancel, onFinish) => {
    const wrapper = document.createElement('div');
    wrapper.className = "text-center py-4 w-full animate-fade-in";

    let html = `
        <h2 class="text-2xl font-extrabold text-gray-900 tracking-tight">Map Variables</h2>
        <p class="mt-2 text-sm text-gray-500 mb-6">Select a variable to assign an Excel column to it.</p>
        <div class="flex flex-col space-y-3 max-h-[50vh] overflow-y-auto px-2 text-left">
    `;

    Object.entries(variablesMap).forEach(([varName, mapping]) => {
        const isMapped = mapping !== null;
        html += `
            <button data-var="${varName}" class="variable-btn group w-full flex items-center justify-between p-4 border-2 rounded-xl transition-all duration-200 hover:border-indigo-400 hover:shadow-md ${isMapped ? 'border-green-200 bg-green-50/30' : 'border-gray-200 bg-white'}">
                <span class="font-mono font-bold ${isMapped ? 'text-green-700' : 'text-indigo-600'}">${varName}</span>
                <span class="text-sm font-medium flex items-center">
                    ${isMapped
                ? `<span class="text-green-600 flex items-center">${SVG_ICONS.CHECK("currentColor")} ${mapping.sheet} &rarr; Col ${mapping.column}</span>`
                : `<span class="text-gray-400 group-hover:text-indigo-500">Unmapped &rarr;</span>`
            }
                </span>
            </button>
        `;
    });

    html += `</div>
        <div class="mt-8 flex justify-end space-x-3 pt-4 border-t border-gray-100" id="wizard-actions"></div>
    `;

    wrapper.innerHTML = html;

    wrapper.querySelectorAll('.variable-btn').forEach(btn => {
        btn.onclick = () => onSelectVariable(btn.getAttribute('data-var'));
    });

    const actionsContainer = wrapper.querySelector('#wizard-actions');
    actionsContainer.appendChild(cancelButton(onCancel));

    const finishBtn = document.createElement('button');
    const canFinish = variablesMap['@recipient-email'] !== null;
    finishBtn.disabled = !canFinish;
    finishBtn.className = `inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white transition-colors ${canFinish ? 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer' : 'bg-indigo-300 cursor-not-allowed'}`;
    finishBtn.textContent = 'Confirm Mappings';
    finishBtn.onclick = onFinish;
    actionsContainer.appendChild(finishBtn);

    return wrapper;
};

export const buildSheetSelectionUI = (variableName, sheets, onSelectSheet, onBack) => {
    const wrapper = document.createElement('div');
    wrapper.className = "text-center py-4 w-full animate-fade-in";

    let html = `
        <div class="flex items-center justify-between mb-6">
            <button id="back-btn" class="text-gray-400 hover:text-gray-600 transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            </button>
            <h2 class="text-xl font-bold text-gray-900">Select Sheet for <span class="text-indigo-600 font-mono">${variableName}</span></h2>
            <div class="w-6"></div> </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[50vh] overflow-y-auto px-2 pb-2">
    `;

    sheets.forEach(sheet => {
        html += `
            <button data-sheet="${sheet}" class="sheet-btn p-4 border-2 border-gray-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 hover:shadow-md transition-all duration-200 transform hover:-translate-y-1 text-center flex flex-col items-center justify-center gap-3 h-28 bg-white">
                ${SVG_ICONS.SPREAD_SHEET}
                <span class="font-medium text-sm text-gray-700 truncate w-full px-1" title="${sheet}">${sheet}</span>
            </button>
        `;
    });

    html += `</div>`;
    wrapper.innerHTML = html;

    wrapper.querySelector('#back-btn').onclick = onBack;
    wrapper.querySelectorAll('.sheet-btn').forEach(btn => {
        btn.onclick = () => onSelectSheet(btn.getAttribute('data-sheet'));
    });

    return wrapper;
};

export const buildColumnSelectionUI = (variableName, sheetName, columns, usedColumns, onSelectColumn, onBack) => {
    const wrapper = document.createElement('div');
    wrapper.className = "text-center py-4 w-full animate-fade-in";

    let html = `
        <div class="flex items-center justify-between mb-2">
            <button id="back-btn" class="text-gray-400 hover:text-gray-600 transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            </button>
            <h2 class="text-xl font-bold text-gray-900">Select Column for <span class="text-indigo-600 font-mono">${variableName}</span></h2>
            <div class="w-6"></div>
        </div>
        <p class="text-sm text-gray-500 mb-6">From sheet: <span class="font-semibold text-gray-700">${sheetName}</span></p>
        
        <div class="grid grid-cols-4 sm:grid-cols-6 gap-3 max-h-[50vh] overflow-y-auto px-2 pb-2">
    `;

    columns.forEach(col => {
        const isUsed = usedColumns.includes(col);
        html += `
            <button ${isUsed ? 'disabled' : ''} data-col="${col}" class="col-btn py-3 px-2 border-2 rounded-lg font-bold text-lg transition-all duration-200 
                ${isUsed ? 'border-gray-100 bg-gray-100 text-gray-300 cursor-not-allowed' : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-500 hover:text-indigo-600 hover:shadow-md transform hover:scale-105'}">
                ${col}
            </button>
        `;
    });

    html += `</div>`;
    wrapper.innerHTML = html;

    wrapper.querySelector('#back-btn').onclick = onBack;
    wrapper.querySelectorAll('.col-btn:not([disabled])').forEach(btn => {
        btn.onclick = () => onSelectColumn(btn.getAttribute('data-col'));
    });

    return wrapper;
};

export const buildRecipientsTableUI = (data, currentPage, itemsPerPage, onPageChange, onClear) => {
    const wrapper = document.createElement('div');
    wrapper.className = "animate-fade-in w-full";

    if (!data || data.length === 0) return wrapper;

    const totalPages = Math.ceil(data.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = data.slice(startIndex, startIndex + itemsPerPage);

    const columns = Object.keys(data[0]);

    let html = `
        <div class="flex justify-between items-center mb-4 px-2">
            <h3 class="text-lg font-bold text-gray-900">Extracted Data <span class="text-sm font-medium text-indigo-600 ml-2 px-2.5 py-0.5 rounded-full bg-indigo-100">${data.length} total</span></h3>
            <button id="clear-table-btn" class="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors">
                ${SVG_ICONS.CLEAR}
                Clear Data
            </button>
        </div>
        
        <div class="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
    `;

    columns.forEach(column => {
        html += `<th scope="col" class="px-6 py-3 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">${column}</th>`;
    });

    html += `</tr></thead><tbody class="bg-white divide-y divide-gray-200">`;

    paginatedData.forEach(row => {
        html += `<tr class="hover:bg-gray-50 transition-colors">`;
        columns.forEach(col => {
            html += `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">${row[col] || '-'}</td>`;
        });
        html += `</tr>`;
    });

    html += `
            </tbody>
        </table>
    </div>
    `;

    html += `
    <div class="flex items-center justify-between mt-4 px-2">
        <p class="text-sm text-gray-500">
            Showing <span class="font-bold text-gray-900">${startIndex + 1}</span> to <span class="font-bold text-gray-900">${Math.min(startIndex + itemsPerPage, data.length)}</span> of <span class="font-bold text-gray-900">${data.length}</span> recipients
        </p>
        <div class="flex space-x-2">
            <button id="prev-page-btn" ${currentPage === 1 ? 'disabled' : ''} class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                Previous
            </button>
            <button id="next-page-btn" ${currentPage === totalPages ? 'disabled' : ''} class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                Next
            </button>
        </div>
    </div>
    `;

    wrapper.innerHTML = html;

    const prevBtn = wrapper.querySelector('#prev-page-btn');
    const nextBtn = wrapper.querySelector('#next-page-btn');
    const clearBtn = wrapper.querySelector('#clear-table-btn');

    if (prevBtn) prevBtn.onclick = () => onPageChange(currentPage - 1);
    if (nextBtn) nextBtn.onclick = () => onPageChange(currentPage + 1);
    if (clearBtn) clearBtn.onclick = () => onClear();

    return wrapper;
};