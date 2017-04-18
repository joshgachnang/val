interface ObjectConstructor {
    assign(target: any, ...sources: any[]): any;
    values(target: any): any;
}

interface Array<T> {
  find(predicate: (search: T) => boolean): T;
}

if (typeof Object.assign !== 'function') {
  (function () {
    Object.assign = function (target) {
      if (target === undefined || target === null) {
        throw new TypeError('Cannot convert undefined or null to object');
      }

      let output = Object(target);
      for (let index = 1; index < arguments.length; index++) {
        let source = arguments[index];
        if (source !== undefined && source !== null) {
          for (let nextKey in source) {
            if (source.hasOwnProperty(nextKey)) {
              output[nextKey] = source[nextKey];
            }
          }
        }
      }
      return output;
    };
  })();
}

if (typeof Object.values !== 'function') {
  (function () {
    Object.values = function (target) {
      let vals = [];
      for (let key in target) {
        if (target.hasOwnProperty(key)) {
          vals.push(target[key]);
        }
      }
      return vals;
    };
  })();
}
