import { API_BASE_URL, AuthenticationStatus } from './core/config.mjs';
import { SVG_ICONS } from './ui/svg-icons.mjs';
import { cancelButton, recipientsOrderedList, setCheckCredentials, togglePassword, newVariablePopUpAlert, appendVariableElementToList, buildColumnSelectionUI, buildSheetSelectionUI, buildVariableSelectionUI, buildRecipientsTableUI } from './ui/ui-components.mjs';
import { createNewController, apiCheckCredentials, apiSendEmails, apiTestConnection } from './core/api-fetches.mjs';
import { initRichTextEditor } from './ui/tiptap-text-editor.mjs'

const senderEmail = document.getElementById('sender-email');
const senderEmailPassword = document.getElementById('sender-email-password');
const eyeBtn = document.getElementById('toggle-password');
const checkCredentialsBtn = document.getElementById('check-credentials');
const recipientsDataFromExcel = document.getElementById('recipients-data-from-xlsx');
const popUpAlertContainer = document.getElementById('pop-up-alert-container');
const popUpAlertContent = document.getElementById('pop-up-alert-content');
const savedRecipientsContainer = document.getElementById('recipients-saved');
const variablesList = document.getElementById('variables-list');
const newVariableBtn = document.getElementById('add-new-variable');
const subject = document.getElementById('subject');
const content = document.getElementById('content');
export const validationField = document.getElementById('editor-validation-bridge');
export const editorContainer = document.getElementById('editor-container')
const attachment = document.getElementById('attachment');
const emailSendingForm = document.getElementById('email-sending-form');
export const emailSendingBtn = document.getElementById('btn-send-email');

let emailEditor;

let recipientsData = [];
let currentTablePage = 1;
const ROWS_PER_PAGE = 10;

let customVariablesMap = {
    '@recipient-email': null
};

window.addEventListener('DOMContentLoaded', () => {
    emailEditor = initRichTextEditor('editor-container', () => {
        return Object.keys(customVariablesMap);
    });
});

const getFileBuffer = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    return new Uint8Array(arrayBuffer);
};

const loadRecipientsData = async (file) => {
    savedRecipientsContainer.className = "mt-6 p-6 bg-gray-50 rounded-xl border border-gray-200 shadow-inner flex justify-center";
    savedRecipientsContainer.innerHTML = `<svg class="animate-spin h-10 w-10 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;

    try {
        const js_buffer = await getFileBuffer(file);
        const mappingStr = JSON.stringify(customVariablesMap);
        const data = window.py_extract_mapped_data(js_buffer, mappingStr);

        if (data && data.length > 0) {
            recipientsData = data;
            currentTablePage = 1;
            renderTable();
        } else {
            savedRecipientsContainer.innerHTML = `<p class="text-red-500 font-bold text-center w-full">No valid data found based on those mappings.</p>`;
        }
    } catch (error) {
        console.error('Error during POST /extract-mapped-data request', error);
    }
};

senderEmail.addEventListener('input', () => {
    setCheckCredentials(checkCredentialsBtn, AuthenticationStatus.AVAILABLE);
});

senderEmailPassword.addEventListener('input', () => {
    setCheckCredentials(checkCredentialsBtn, AuthenticationStatus.AVAILABLE);
});

checkCredentialsBtn.addEventListener('click', async () => await checkCredentials());

const checkCredentials = async () => {
    try {
        setCheckCredentials(checkCredentialsBtn, AuthenticationStatus.PROCESSING);
        const data = await apiCheckCredentials(senderEmail.value, senderEmailPassword.value);
        const nextState = data.authorized ? AuthenticationStatus.SUCCEED : AuthenticationStatus.FAILED;
        setCheckCredentials(checkCredentialsBtn, nextState);
    } catch (error) {
        console.error('Error during POST /check-credentials request', error);
    }
}

recipientsDataFromExcel.addEventListener('change', async (event) => {
    if (recipientsDataFromExcel.files.length === 0) {
        savedRecipientsContainer.replaceChildren();
        savedRecipientsContainer.className = "empty:hidden";
        return;
    }

    const file = recipientsDataFromExcel.files[0];
    const { controller: fileMetadataController, signal: fileMetadataSignal } = createNewController();

    popUpAlertContent.innerHTML = `
        <div id="waiting-container" class="text-center py-4">
            <h2 class="text-xl font-bold text-gray-900">Analyzing Workbook</h2>
            <p class="mt-2 text-sm text-gray-500">This can take a few seconds...</p>
            <div class="flex justify-center p-8">
                <svg class="animate-spin h-10 w-10 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
        </div>
    `;

    document.getElementById('waiting-container').appendChild(cancelButton(() => {
        fileMetadataController.abort();
        popUpAlertContainer.classList.add('hidden');
        popUpAlertContent.replaceChildren();
        event.target.value = '';
    }));

    popUpAlertContainer.classList.remove('hidden');

    if (!window.pyScriptReady) {
        alert("Please wait a few seconds for the local Excel engine to initialize.");
        event.target.value = '';
        return;
    }

    try {
        const js_buffer = await getFileBuffer(file);
        const sheets = window.py_get_sheets(js_buffer);

        let currentVariable = null;
        let currentSheet = null;

        const renderWizard = async () => {
            if (currentVariable === null) {
                const ui = buildVariableSelectionUI(
                    customVariablesMap,
                    (selectedVar) => { currentVariable = selectedVar; renderWizard(); },
                    () => { popUpAlertContainer.classList.add('hidden'); event.target.value = ''; },
                    async () => {
                        console.log("Final Mappings ready for Backend:", customVariablesMap);
                        popUpAlertContainer.classList.add('hidden');
                        await loadRecipientsData(file);
                        validateFormCompletion();
                    }
                );
                popUpAlertContent.replaceChildren(ui);

            } else if (currentSheet === null) {
                const ui = buildSheetSelectionUI(
                    currentVariable,
                    sheets,
                    async (selectedSheet) => { currentSheet = selectedSheet; await renderWizard(); },
                    () => { currentVariable = null; renderWizard(); }
                );
                popUpAlertContent.replaceChildren(ui);

            } else {
                popUpAlertContent.innerHTML = `
                    <div id="waiting-container" class="text-center py-4">
                        <h2 class="text-xl font-bold text-gray-900">Analyzing Sheet '${currentSheet}'</h2>
                        <p class="mt-2 text-sm text-gray-500">This can take a few seconds...</p>
                        <div class="flex justify-center p-8">
                            <svg class="animate-spin h-10 w-10 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                    </div>
                `;

                document.getElementById('waiting-container').appendChild(cancelButton(() => {
                    loadActiveColumnsController.abort();
                    popUpAlertContainer.classList.add('hidden');
                    popUpAlertContent.replaceChildren();
                    event.target.value = '';
                }));

                const active_columns = window.py_get_active_columns(js_buffer, currentSheet);

                const usedColumns = Object.values(customVariablesMap)
                    .filter(mapping => mapping !== null && mapping.sheet === currentSheet)
                    .map(mapping => mapping.column);

                const ui = buildColumnSelectionUI(
                    currentVariable,
                    currentSheet,
                    active_columns,
                    usedColumns,
                    (selectedCol) => {
                        customVariablesMap[currentVariable] = { sheet: currentSheet, column: selectedCol };
                        currentVariable = null;
                        currentSheet = null;
                        renderWizard();
                    },
                    () => { currentSheet = null; renderWizard(); }
                );
                popUpAlertContent.replaceChildren(ui);
            }
        };

        renderWizard();

    } catch (error) {
        console.error("Error setting up variables:", error);
        popUpAlertContainer.classList.add('hidden');
    }
});

senderEmailPassword.addEventListener('keydown', async (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        await checkCredentials();
    }
});


const validateFormCompletion = () => {
    emailSendingBtn.disabled = !emailSendingForm.checkValidity() || recipientsData.length === 0;
    emailSendingBtn.className = `w-full flex justify-center items-center px-4 py-3 border border-transparent shadow-sm text-lg font-medium rounded-md text-white transition-colors ${ !emailSendingBtn.disabled ? "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer" : "bg-indigo-300 cursor-not-allowed" }`;
};

emailSendingForm.addEventListener('input', () => {
    validateFormCompletion();
});

emailSendingForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (recipientsData.length === 0 || !recipientsData[0]['@recipient-email']) {
        console.error("Please map and extract your Excel data before sending the campaign."); // TODO: implement Toast Messages for better user feedback
        return;
    }

    if (emailEditor.isEmpty) {
        console.error("Please provide an email message content."); // TODO: implement Toast Messages for better user feedback
        return;
    }

    emailSendingBtn.className = "w-full flex justify-center items-center px-4 py-3 border border-transparent shadow-sm text-lg font-medium rounded-md text-white transition-colors bg-green-600 cursor-default";
    emailSendingBtn.innerHTML = `
        ${SVG_ICONS.CHECK("#ffffff")}
        Emails Being Sent!
    `;

    try {
        const emailAttachment = attachment.files.length > 0 ? attachment.files[0] : null;
        const data = await apiSendEmails(senderEmail.value, senderEmailPassword.value, recipientsData, subject.value, emailEditor.getHTML(), emailAttachment);
    } catch (error) {
        console.error('Error during POST /send-emails request', error);
    }
});

newVariableBtn.addEventListener('click', () => {
    const popUpComponent = newVariablePopUpAlert(() => {
        popUpAlertContainer.classList.add('hidden');
        popUpAlertContent.replaceChildren();
    });

    const newVariableForm = popUpComponent.querySelector('#new-variable-form');
    const newVariableInput = popUpComponent.querySelector('#new-variable-input');
    const newVariableNaming = popUpComponent.querySelector('#new-variable-naming');
    const createNewVariable = popUpComponent.querySelector('#create-new-variable-btn');

    let kebabCaseVariableName = '';

    newVariableInput.addEventListener('input', () => {
        const hasValue = newVariableInput.value.trim() !== '';

        kebabCaseVariableName = hasValue ? '@' + newVariableInput.value.toLowerCase().replaceAll(/[\s\_]/g, '-') : 'undefined';
        newVariableNaming.textContent = kebabCaseVariableName;

        createNewVariable.disabled = !hasValue;

        if (hasValue) {
            createNewVariable.classList.remove('bg-indigo-300', 'cursor-not-allowed');
            createNewVariable.classList.add('bg-indigo-600', 'hover:bg-indigo-700', 'cursor-pointer');
        } else {
            createNewVariable.classList.remove('bg-indigo-600', 'hover:bg-indigo-700', 'cursor-pointer');
            createNewVariable.classList.add('bg-indigo-300', 'cursor-not-allowed');
        }
    });

    newVariableForm.addEventListener('submit', () => {
        if (!customVariablesMap.hasOwnProperty(kebabCaseVariableName)) {
            customVariablesMap[kebabCaseVariableName] = null;

            appendVariableElementToList(variablesList, newVariableInput.value, kebabCaseVariableName);

            popUpAlertContainer.classList.add('hidden');
            popUpAlertContent.replaceChildren();
        } else {
            console.log('Variable already defined, please define a different one'); // TODO, feedback user in UI, not in console
        }
    });

    popUpAlertContent.replaceChildren(popUpComponent);
    popUpAlertContainer.classList.remove('hidden');
});

const renderTable = () => {
    savedRecipientsContainer.className = "mt-6 p-6 bg-gray-50 rounded-xl border border-gray-200 shadow-inner";

    const ui = buildRecipientsTableUI(
        recipientsData,
        currentTablePage,
        ROWS_PER_PAGE,
        (newPage) => {
            currentTablePage = newPage;
            renderTable();
        },
        () => {
            recipientsData = [];
            currentTablePage = 1;
            savedRecipientsContainer.replaceChildren();
            savedRecipientsContainer.className = "empty:hidden";
            recipientsDataFromExcel.value = '';
        },
    );
    savedRecipientsContainer.replaceChildren(ui);
};

window.togglePassword = () => togglePassword(senderEmailPassword, eyeBtn);