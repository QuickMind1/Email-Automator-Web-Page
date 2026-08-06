import { API_BASE_URL } from "./config.mjs";

export const createNewController = () => {
    const controller = new AbortController();
    const { signal } = controller;
    return { controller, signal };
};

export const apiTestConnection = async () => {
    const response = await fetch(`${API_BASE_URL}/`);
    return await response.json();
};

export const apiCheckCredentials = async (email, password) => {
    const formData = new FormData();
    formData.append('sender_email', email);
    formData.append('sender_email_password', password);

    const response = await fetch(`${API_BASE_URL}/check-credentials`, {
        method: 'POST',
        body: formData
    });

    return await response.json();
};

export const apiFileMetadata = async (file, signal) => {
    const formData = new FormData();
    formData.append('excel_file', file);

    const response = await fetch(`${API_BASE_URL}/file-metadata`, {
        method: 'POST',
        body: formData,
        signal
    });

    return await response.json();
};

export const apiLoadRecipientsByPlainText = async (recipients) => {
    const formData = new FormData();
    formData.append('plain_text', recipients);

    const response = await fetch(`${API_BASE_URL}/load-recipients-by-plain-text`, {
        method: 'POST',
        body: formData
    });

    return await response.json();
};

export const apiLoadRecipientsByXlsx = async (file, recipientsSheet) => {
    const formData = new FormData();
    formData.append('excel_file', file);
    formData.append('recipients_sheet', recipientsSheet);

    const response = await fetch(`${API_BASE_URL}/load-recipients-by-xlsx`, {
        method: 'POST',
        body: formData,
    });

    return await response.json();
};

export const apiSendEmails = async (sender_email, sender_email_password, recipientsData, subject, content, attachment = null) => {
    const formData = new FormData();
    formData.append('sender_email', sender_email);
    formData.append('sender_email_password', sender_email_password);
    formData.append('recipients_data', JSON.stringify(recipientsData));
    formData.append('subject', subject);
    formData.append('raw_content', content);
    if (attachment !== null) {
        formData.append('attachment', attachment);
    }

    const response = await fetch(`${API_BASE_URL}/send-emails`, {
        method: 'POST',
        body: formData
    });

    return await response.json();
};

export const apiLoadActiveColumns = async (file, sheetName, signal) => {
    const formData = new FormData();
    formData.append('excel_file', file);
    formData.append('sheet_name', sheetName);

    const response = await fetch(`${API_BASE_URL}/load-active-columns`, {
        method: 'POST',
        body: formData,
        signal
    });

    return await response.json();
}

export const apiExtractMappedData = async (file, variablesMap) => {
    const formData = new FormData();
    formData.append('excel_file', file);
    formData.append('variables_mapping', JSON.stringify(variablesMap));

    const response = await fetch(`${API_BASE_URL}/extract-mapped-data`, {
        method: 'POST',
        body: formData
    });

    return await response.json();
}