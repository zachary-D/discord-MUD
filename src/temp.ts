class MyClass {
    counter: number;

    static lastCounter = -1;
    
    constructor() {
        this.counter = MyClass.lastCounter++;
    }
}

const a = new MyClass();
console.log(a);
const b = new MyClass();
console.log(b);
const c = new MyClass();
console.log(c);