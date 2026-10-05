import Image from 'https://esm.sh/@tiptap/extension-image@2.2.4';
import { Editor } from 'https://esm.sh/@tiptap/core@2.2.4';
import StarterKit from 'https://esm.sh/@tiptap/starter-kit@2.2.4';
import Placeholder from 'https://esm.sh/@tiptap/extension-placeholder@2.2.4';
import Mention from 'https://esm.sh/@tiptap/extension-mention@2.2.4';
import tippy from 'https://esm.sh/tippy.js@6.3.7';  
import { validationField } from '../app.mjs';

export const initRichTextEditor = (containerId, getVariablesCallback) => {
    const suggestionConfig = {
        items: ({ query }) => {
            const variables = getVariablesCallback();
            return variables
                .filter(item => {
                    const cleanItem = item.replace('@', '');
                    return cleanItem.toLowerCase().startsWith(query.toLowerCase());
                })
                .slice(0, 5);
        },
        render: () => {
            let component;
            let popup;

            return {
                onStart: props => {
                    component = document.createElement('div');
                    component.className = "bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden flex flex-col py-1 min-w-[150px]";

                    props.items.forEach((item, index) => {
                        const btn = document.createElement('button');
                        btn.className = "text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors font-mono";
                        btn.textContent = item;
                        btn.onclick = () => props.command({ id: item, label: item.replace('@', '') });
                        component.appendChild(btn);
                    });

                    if (!props.clientRect) return;

                    popup = tippy('body', {
                        getReferenceClientRect: props.clientRect,
                        appendTo: () => document.body,
                        content: component,
                        showOnCreate: true,
                        interactive: true,
                        trigger: 'manual',
                        placement: 'bottom-start',
                    });
                },
                onUpdate: props => {
                    if (component) {
                        component.innerHTML = '';
                        if (props.items.length === 0) {
                            component.innerHTML = `<div class="px-4 py-2 text-sm text-gray-400 italic">No variables found</div>`;
                        } else {
                            props.items.forEach((item) => {
                                const btn = document.createElement('button');
                                btn.className = "text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors font-mono";
                                btn.textContent = item;
                                btn.onclick = () => props.command({ id: item, label: item.replace('@', '') });
                                component.appendChild(btn);
                            });
                        }
                        popup[0].setProps({ getReferenceClientRect: props.clientRect });
                    }
                },
                onExit: () => {
                    if (popup) popup[0].destroy();
                    if (component) component.remove();
                }
            };
        }
    };

    const editor = new Editor({
        element: document.getElementById(containerId),
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: 'Draft your automated email here...',
            }),
            Mention.configure({
                HTMLAttributes: { class: 'mention' },
                suggestion: suggestionConfig,
            }),
            Image.configure({
                inline: true,
                allowBase64: true,
            }),
        ],
        editorProps: {
            handleDrop: function(view, event, slice, moved) {
                if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
                    const file = event.dataTransfer.files[0];
                    if (file.type.startsWith('image/')) {
                        event.preventDefault();

                        const reader = new FileReader()
                        reader.onload = (e) => {
                            const base64String = e.target.result;
                            const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
                            if (coordinates) {
                                editor.chain().focus().setTextSelection(coordinates.pos).setImage({ src: base64String }).run();
                            } else {
                                editor.chain().focus().setImage({ src: base64String }).run();
                            }
                        };
                        reader.readAsDataURL(file);
                        return true;
                    }
                }
                return false;
            }
        },
        onUpdate({ editor }) {
            validationField.textContent = editor.getText().trim().length > 0 ? editor.getText() : '';
            validationField.dispatchEvent(new Event('input', { bubbles: true }));

            document.getElementById('btn-bold').classList.toggle('bg-gray-200', editor.isActive('bold'));
            document.getElementById('btn-italic').classList.toggle('bg-gray-200', editor.isActive('italic'));
            document.getElementById('btn-bullet').classList.toggle('bg-gray-200', editor.isActive('bulletList'));
        }
    });

    const btnImage = document.getElementById('btn-image');
    const imageUpload = document.getElementById('image-upload');
    btnImage.addEventListener('click', () => {
        imageUpload.click();
    });
    imageUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const base64String = e.target.result;
                editor.chain().focus().setImage({ src: base64String }).run();
            };
            reader.readAsDataURL(file);
        }
        event.target.value = '';
    });
    const btnEmoji = document.getElementById('btn-emoji');
    const emojiPopover = document.getElementById('emoji-popover');
    const emojiPicker = document.querySelector('emoji-picker');
    btnEmoji.addEventListener('click', (event) => {
        event.stopPropagation();
        emojiPopover.classList.toggle('hidden');
    });
    emojiPicker.addEventListener('emoji-click', (event) => {
        editor.chain().focus().insertContent(event.detail.unicode).run();
    });
    document.addEventListener('click', (event) => {
        if (!emojiPopover.contains(event.target) && event.target !== btnEmoji) {
            emojiPopover.classList.add('hidden');
        }
    });
    document.getElementById('btn-bold').onclick = () => editor.chain().focus().toggleBold().run();
    document.getElementById('btn-italic').onclick = () => editor.chain().focus().toggleItalic().run();
    document.getElementById('btn-bullet').onclick = () => editor.chain().focus().toggleBulletList().run();

    return editor;
};