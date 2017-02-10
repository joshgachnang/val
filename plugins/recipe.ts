import * as csv from 'fast-csv';

import AlexaAdapter from '../adapters/alexa';
import Robot from '../robot';
import Response from '../response';

enum Unit {
  Each, Cup, Tablespoon, Teaspoon, Ounce, FluidOunce
}


class Food {
  constructor(private name: string, private calories: number, private servingSize: number,
    private servingSizeUnit: number, private cost?: number) {}
}

class Ingredient {
  constructor(private food: Food, private amount: number, private unit: Unit) {}
}

class Recipe {
  constructor(private name: string, private ingredients: Ingredient[], private instructions: string[]) {}
}

function loadFromCSV(filename: string) {
  let stream = fs.createReadStream(filename);
  let csvStream = csv()
    .on("data", function(data){
         console.log(data);
    })
    .on("end", function(){
         console.log("done");
    });

  stream.pipe(csvStream);
}

export default function(robot: Robot) {

}
