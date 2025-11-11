// Test timezone conversion
const timezoneOffset = new Date().getTimezoneOffset();
console.log("Timezone offset:", timezoneOffset, "minutes");
console.log("India timezone offset should be: -330 minutes");
console.log("");

// Example: User selects 12:45 PM
const hour = 12;
const minute = 45;
const period = "PM";

console.log(`User selected: ${hour}:${String(minute).padStart(2, '0')} ${period}`);

// Convert to 24-hour
let hours24 = hour;
if (period === 'AM' && hours24 === 12) {
  hours24 = 0;
} else if (period === 'PM' && hours24 !== 12) {
  hours24 = hours24 + 12;
}

console.log(`24-hour format: ${hours24}:${String(minute).padStart(2, '0')}`);

// Apply timezone offset
const totalMinutes = hours24 * 60 + minute + timezoneOffset;

let utcHours = Math.floor(totalMinutes / 60);
let utcMinutes = totalMinutes % 60;

// Normalize
if (utcHours < 0) {
  utcHours = (utcHours % 24) + 24;
} else if (utcHours >= 24) {
  utcHours = utcHours % 24;
}

if (utcMinutes < 0) {
  utcMinutes += 60;
  utcHours -= 1;
  if (utcHours < 0) utcHours += 24;
}

const utcTime = `${String(utcHours).padStart(2, '0')}:${String(utcMinutes).padStart(2, '0')}`;

console.log(`Converted to UTC: ${utcTime}`);
console.log("");
console.log("Verification:");
console.log(`  ${hour}:${String(minute).padStart(2, '0')} ${period} India = ${hours24}:${String(minute).padStart(2, '0')}`);
console.log(`  ${hours24}:${String(minute).padStart(2, '0')} - 5:30 = ${utcTime} UTC`);
console.log(`  ${hours24} * 60 + ${minute} + (${timezoneOffset}) = ${totalMinutes} minutes = ${utcTime}`);
