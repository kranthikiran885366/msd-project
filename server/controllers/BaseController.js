class BaseController {
    static bindMethods(instance) {
        const prototype = Object.getPrototypeOf(instance);
        const propertyNames = Object.getOwnPropertyNames(prototype);
        propertyNames.forEach(name => {
            if (name !== 'constructor' && typeof prototype[name] === 'function') {
                instance[name] = instance[name].bind(instance);
            }
        });
    }
}

module.exports = BaseController;