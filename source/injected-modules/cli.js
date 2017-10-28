let cli = module.exports;

cli.tell = function(text) {
	process.stdout.write(text + '\n');
};

cli.ask = function(promptText, type, skippable) {
	const readline = require('readline');
	const interface = readline.createInterface({input: process.stdin, output: process.stdout});
	
	return new Promise(function(resolve, reject) {
		interface.question(`${promptText} `, function(answer) {
			interface.close();
			
			if (answer === '') {
				if (!skippable) {
					cli.tell(`Please enter a value.`);
					resolve(cli.ask(promptText, type, skippable));
				} else {
					resolve(null);
				}
			} else if (!type) {
				resolve(answer);
			} else {
				let typeDefinition = type[cli.typeDefinitionSymbol] || type;
				
				Promise.resolve()
				.then(() => typeDefinition(answer))
				.then(function(value) {
					resolve(value);
				}, function(errorText) {
					cli.tell(`Value ${errorText}.`);
					resolve(cli.ask(promptText, type, skippable));
				});
			}
		});
	});
};

cli.typeDefinitionSymbol = Symbol();

// Setup type definitions
Boolean[cli.typeDefinitionSymbol] = function(value) {
	switch (value) {
		case 'yes':
		case 'y':
		case 'true':
		case 't':
		case '1':
		case 'yeah':
		case 'yep':
		case 'yup':
		case 'sure':
			return true;
		case 'no':
		case 'n':
		case 'false':
		case 'f':
		case '0':
		case 'nope':
		case 'nah':
		case 'nay':
			return false;
		default:
			throw 'is not a boolean';
	}
};

Number[cli.typeDefinitionSymbol] = function(value) {
	const castValue = Number(value);
	if (isNaN(value)) throw 'is not a valid number';
	return castValue;
};

Object[cli.typeDefinitionSymbol] = function(value) {
	try {
		return JSON.parse(value);
	} catch (e) {
		throw 'is not valid JSON';
	}
};

Array[cli.typeDefinitionSymbol] = function(value) {
	const castValue = [];
	
	let currentIndex = 0;
	while (currentIndex < value.length) {
		// Skip spaces
		while (value[currentIndex] === ' ') currentIndex++;
		
		// New piece
		const startCharacter = value[currentIndex++];
		const isQuoteDelimited = (startCharacter === '\'' || startCharacter === '"');
		const endCharacter = isQuoteDelimited ? startCharacter : ' ';
		
		let pieceString = '';
		
		if (!isQuoteDelimited) pieceString += startCharacter;
		
		while (currentIndex < value.length) {
			const currentCharacter = value[currentIndex++];
			if (currentCharacter === '\\') {
				// Next character is escaped
				pieceString += value[currentIndex++];
			} else if (currentCharacter === endCharacter) {
				break;
			} else {
				pieceString += currentCharacter;
			}
		}
		
		castValue.push(pieceString);

		// Skip spaces
		while (value[currentIndex] === ' ') currentIndex++;
	}
	
	return castValue;
};

RegExp[cli.typeDefinitionSymbol] = function(value) {
	try {
		return new RegExp(value);
	} catch (error) {
		const truncatedMessage = / ?([^:]*)$/.exec(error.message)[1];
		throw 'is not a valid regular expression: ' + truncatedMessage;
	}
};
