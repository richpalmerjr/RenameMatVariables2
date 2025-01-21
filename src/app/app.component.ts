import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';

/*

To update github:

  git commands:

    git init
    git add .
    git commit -m "commit message here"
    git push

    ng build
    ng deploy

  git website:
    https://richpalmerjr.github.io/RenameMatVariables/


To get my code back, just in case it gets deleted for some reason
  git checkout main

*/

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  @ViewChild('renameVariableModal') myModal!: ElementRef;

  codeInput = '';
  codeOutput!: any;
  codeOutputArray: any[] = [];
  linesOfCode: any = [];
  inputVariables: any[] = [];
  singleInputVariables: any[] = [];
  specialCharacters: any = [];
  outputVariables = [];
  updateCallSubs: any = true;
  title = 'Rename Single Letter M-AT Variables';
  consoleDebug = false;
  updatedValues: any = {};
  lineNumber = 0;
  variableDeclaration: string = '';

  // called when clicking the "Rename Variables" button
  convertVariables(codeInput: any) {
    this.resetVariables(); // reset any specific variables that need to be reset at the start
    console.clear();
    console.log("making sure that this gets updated on github")
    console.log(
      '%c ' +
        '==================== START (finding variables) =============================',
      'color: skyblue; font-weight: bold;'
    );

    this.linesOfCode = codeInput.split('\n'); // split all the lines into an array (linesOfCode)

    for (let i = 0; i < this.linesOfCode.length; i++) {
      let line = this.linesOfCode[i]; // specific line of code

      console.log('----------------------------------------------');
      console.log(line.trim());

      const [specialChars, strippedString] = this.storeSpecialCharacters(line);
      console.log('special characters', specialChars);

      // split the string into an array of words
      const splitStrippedString = (strippedString as string).split(' '); // (strippedString as string) is telling the code we know it's a string

      // find any variables within the split string
      for (let i = 0; i < splitStrippedString.length; i++) {
        if (this.isVariable(splitStrippedString[i])) {
          const message = '\tVariable found: ' + splitStrippedString[i];
          console.log('%c ' + message, 'color: limegreen; font-weight: bold;');
          this.inputVariables.push(splitStrippedString[i]);
        }
      }

      // create an array of non-repeated variables - this is used in the modal asking what to rename the variables to
      for (let variable of this.inputVariables) {
        if (this.singleInputVariables.includes(variable[0])) 'do nothing';
        else this.singleInputVariables.push(variable[0]);
      }
    }
    console.log(
      '%c ' +
        '===================== END (finding variables) ==============================',
      'color: skyblue; font-weight: bold;'
    );
    console.log('');
  }

  storeSpecialCharactersSAVE(line: string) {
    const specialChars: string[] = [];
    // this replaces all special characters with a space, while simultaneously
    // storing all the special characters within the specialChars array
    const strippedString = line.replace(/[^a-zA-Z0-9\s]/g, (char: string) => {
      specialChars.push(char);
      return ' ';
    });
    return [specialChars, strippedString];
  }

  storeSpecialCharacters(line: string) {
    // {A,B,C}@CallExternalSub("Bar","ProgramName.P","codemembername")
    const specialChars: string[] = [];
    const callExternalSubRegex = /@CallExternalSub\("[^"]*","[^"]*","[^"]*"\)/g;
    const otherSpecialCharsRegex = /([^a-zA-Z0-9])/g;

    // 1. Find all special characters and CallExternalSub occurrences with their indices
    const allSpecialChars: { index: number; value: string }[] = [];
    let match: any;

    // Find CallExternalSub occurrences
    while ((match = callExternalSubRegex.exec(line)) !== null) {
      allSpecialChars.push({ index: match.index, value: match[0] });
    }

    // Find other special characters
    while ((match = otherSpecialCharsRegex.exec(line)) !== null) {
      // Make sure it's not part of a CallExternalSub
      if (
        !allSpecialChars.some(
          (char) =>
            char.index <= match.index &&
            char.index + char.value.length > match.index
        )
      ) {
        allSpecialChars.push({ index: match.index, value: match[0] });
      }
    }

    // Sort the special characters by their indices
    allSpecialChars.sort((a, b) => a.index - b.index);

    // Extract the values into the specialChars array
    for (const char of allSpecialChars) {
      specialChars.push(char.value);
    }

    // Replace all special characters with spaces
    const strippedString = line.replace(
      new RegExp(
        `${callExternalSubRegex.source}|${otherSpecialCharsRegex.source}`,
        'g'
      ),
      ' '
    );

    return [specialChars, strippedString];
  }

  resetVariables() {
    this.codeOutput = '';
    this.inputVariables = [];
    this.singleInputVariables = [];
    this.linesOfCode = [];
    this.updatedValues = {};
    return null;
  }

  renameVariables() {
    let message = '';

    message =
      '==================== START (renaming variables) ============================';
    console.log('%c ' + message, 'color: skyblue; font-weight: bold;');

    // reset any necessary variables
    this.updatedValues = {};
    this.variableDeclaration = '';
    this.codeOutput = 'var: ';
    this.codeOutputArray = [];
    let wordsArray: any = [];

    // get the new variable names from the modal
    this.getNewVariableNames();

    for (const key in this.updatedValues) {
      const value = this.updatedValues[key];
      this.codeOutput += value + ' ';
    }
    /*
     IF{{A}@CallSub(Something123) {B,C}@CallSub(SomethingElse456)}
     {A,B,C}@CallExternalSub("Bar","ProgramName.P","codemembername")
    */

    for (let i = 0; i < this.linesOfCode.length; i++) {
      wordsArray = [];
      let word = '';
      let splitStrippedString: any = [];

      let line = this.linesOfCode[i].trim();

      console.log('-----------------------------------');
      console.log(line);

      const [specialChars, strippedString] = this.storeSpecialCharacters(line);

      console.log('specialChars', specialChars);
      console.log('strippedString', strippedString);

      // split the string into an array of words
      //const splitStrippedString = (strippedString as string).split(' '); // (strippedString as string) is telling the code we know it's a string

      for (let j = 0; j < strippedString.length; j++) {
        let letter = strippedString[j];
        if (letter == " ") {
          if (word !== "") wordsArray.push(word);
          word = "";
          wordsArray.push("");
        }
        // else, if it's not a special character (a letter or number), construct the word
        else {
          word += letter;
        }
      }

      if (word) wordsArray.push(word);

      console.log('splitStrippedString', splitStrippedString);
      console.log('wordsArray', wordsArray);

      // // find any variables within the split string
      // for (let i = 0; i < splitStrippedString.length; i++) {
      //   if (this.isVariable(splitStrippedString[i])) {
      //     const message = '\tVariable found: ' + splitStrippedString[i];
      //     console.log('%c ' + message, 'color: limegreen; font-weight: bold;');
      //     wordsArray.push(this.updatedValues[splitStrippedString[i]]);
      //   } else {
      //     wordsArray.push(splitStrippedString[i]);
      //   }
      // }

      let specialCharIndex = 0;
      let finalLine = "";

      // loop on the wordsArray
      for (let j = 0; j < wordsArray.length; j++) {
        let wordToCheck = wordsArray[j];
        console.log("checking word",wordToCheck)
        // if the word to check is nil, add the special character back
        // to the final string (spaces are considered special characters)
        if (wordToCheck == "") {
          finalLine += specialChars[specialCharIndex];
          specialCharIndex++;

        }
        // else, add the word to the final line
        else {
          if (this.isVariable(wordToCheck)) {
            // if it's a variable, rename it and add that to the final line instead
            let newVariable = this.updatedValues[wordToCheck];
            const message = '\tChanging ' + wordToCheck + ' to ' + newVariable;
            console.log(
              '%c ' + message,
              'color: limegreen; font-weight: bold;'
            );
            wordToCheck = newVariable;
          }
          finalLine += wordToCheck;
        }
      }
      
      console.log('FINAL LINE:', finalLine);
      this.codeOutput += '\n' + finalLine;
      this.codeOutputArray.push(finalLine);

      if (this.updateCallSubs == true) {
        this.updateCallSubsLogic();
      }

    }

    message =
      '===================== END (renaming variables) =============================';
    console.log('%c ' + message, 'color: skyblue; font-weight: bold;');
  }

  updateCallSubsLogic() {
    console.log('');
    console.log(
      '%c ' +
        '===================== START (updating CallSubs) ============================',
      'color: skyblue; font-weight: bold;'
    );

    let newCodeOutputArray = [];

    for (let i = 0; i < this.codeOutputArray.length; i++) {
      let line = this.codeOutputArray[i];
      console.log('----------------------------------------------');
      console.log(line.trim());

      if (line.includes('@CallSub')) {
        const message = '\tCallSub found on line';
        console.log('%c ' + message, 'color: limegreen; font-weight: bold;');
        line = this.updateCallSubString(line);
        newCodeOutputArray.push(line);
      } else if (line.includes('@CallExternalSub')) {
        const message = '\CallExternalSub found on line';
        console.log('%c ' + message, 'color: limegreen; font-weight: bold;');
        line = this.updateCallExternalSubString(line);
        newCodeOutputArray.push(line);
      } else {
        newCodeOutputArray.push(line);
      }
    }
    this.codeOutputArray = [];
    this.codeOutput = '';
    for (let newLine of newCodeOutputArray) {
      this.codeOutputArray.push(newLine);
      this.codeOutput += newLine + '\n';
    }

    console.log(
      '%c ' +
        '====================== END (updating CallSubs) =============================',
      'color: skyblue; font-weight: bold;'
    );

    console.log('new code output array', newCodeOutputArray);
  }

  // Replaces @CallSub(<string>) with @@<string>()
  // i.e. @CallSub(CodeMember) with @@CodeMember()
  updateCallSubString(str: string): string {
    const regex = /@CallSub\(([^)]+)\)/g;
    return str.replace(regex, '@@$1()');
  }

  // Replaces @CallExternalSub(<string1>,<string2>,<string3>) with @@<string2>:<string3>()
  // i.e. @CallExternalSub("App","AppProgram.ProgramName.C","CodeMember") with @@AppProgram.ProgramName.C:CodeMember()
  updateCallExternalSubString(str: string): string {
    const regex = /@CallExternalSub\("([^"]+)","([^"]+)","([^"]+)"\)/g
    return str.replace(regex, '@@$2:$3()')
  }

  getNewVariableNames() {
    // get all the values from the modal in order to replace the variables
    this.singleInputVariables.forEach((variable) => {
      const inputElement = document.getElementById(
        variable
      ) as HTMLInputElement;
      if (inputElement) {
        this.updatedValues[variable] = inputElement.value;
      }
      this.variableDeclaration =
        this.variableDeclaration + ' ' + this.updatedValues[variable];
    });

    this.updateCallSubs = (
      document.getElementById('updateCallSubs') as HTMLInputElement
    ).checked;
    console.log('update call subs:', this.updateCallSubs);
  }

  isVariable(str: string) {
    const myRegex = /^[A-Z]$/;
    return myRegex.test(str.trim());
  }

  clearForms() {
    this.codeInput = '';
    this.codeOutput = '';
  }
}
