import { customAlphabet } from "nanoid";

const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
const createId = customAlphabet(alphabet, 16);

export { createId };
