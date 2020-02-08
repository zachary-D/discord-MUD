//Waits for `ms` milliseconds, then continues
export function sleep(ms : number) : Promise<void>
{
    return new Promise( (resolve, reject) => {
        setTimeout(resolve, ms);
    });
}

//Returns the common elements from two arrays
export function intersection<T>(first : Array<T>, second : Array<T>) : Array<T>
{
    return first.filter( f => {second.includes(f)});
}