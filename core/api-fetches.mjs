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