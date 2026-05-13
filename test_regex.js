const title = 'Topic 1.1.1: Four Chambers of the Heart';
const regex = /^(?:(?:Module|Chapter|Topic)\s*)?[\d\.]+\s*[-:]?\s*/i;
console.log(title.replace(regex, ''));
