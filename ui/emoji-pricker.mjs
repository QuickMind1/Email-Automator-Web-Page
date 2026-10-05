import { editorContainer } from "../app.mjs";

const btnEmoji = document.getElementById("btn-emoji");
const emojiPopover = document.getElementById("emoji-popover");
const emojiPicker = document.querySelector("emoji-picker");

btnEmoji.addEventListener('click', (event) => {
    event.stopPropagation()
    emojiPicker.classList.toggle('hidden');
});

emojiPicker.addEventListener('emoji-click', (event) => {
})