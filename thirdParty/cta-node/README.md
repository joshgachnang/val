# cta-node

# Project Name

Chicago Transit Authority - Bus and Train Tracker - Node JS module 

## Special Note

First node project. All feedback is appreciated
__This package will change drastically over the next couple of releases.__

## Installation

TODO: Describe the installation process

## Usage

```javascript 


  var cta = require("cta-node");

  // Set environment variables
  // CTA_TRAIN_API_KEY=abc...
  // CTA_BUS_API_KEY=123...
  cta.init()  
  // or pass in as a dictionary
  cta.init({ trainApiKey: "abc...", busApiKey: "123..."});

  cta.train.lStops.byStationName('wilson');
  // array of stops
  cta.train.lStops.byStationNameAndColor('western', 'blue');
  // array of stops

  cta.train.arrivals.byStationNameAndColor('western', 'blue');
  // array of arrivals

  // Look ma, no color... 
  // NOTE: this is going to change
  cta.train.arrivals.byStationNameAndColor('sheridan');
  // array of arrivals

```

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## History

TODO: Write history

## Credits

TODO: Write credits

## License

TODO: Write license
