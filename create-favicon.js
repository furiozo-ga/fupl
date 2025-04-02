// Script to create a white letter "U" on blue background favicon
import { createCanvas } from 'canvas';
import fs from 'fs';

// Create a 32x32 canvas (standard favicon size)
const canvas = createCanvas(32, 32);
const ctx = canvas.getContext('2d');

// Fill the background with blue color
ctx.fillStyle = '#0066cc'; // Blue background
ctx.fillRect(0, 0, 32, 32);

// Set the font style for the letter "U"
ctx.fillStyle = '#FFFFFF'; // White color for the letter
ctx.font = 'bold 24px Arial';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';

// Draw the letter "U" in the center of the canvas
ctx.fillText('U', 16, 16);

// Convert the canvas to a PNG buffer
const buffer = canvas.toBuffer('image/png');

// Save the buffer to a file
fs.writeFileSync('public/favicon.ico', buffer);

console.log('Favicon created successfully!');
