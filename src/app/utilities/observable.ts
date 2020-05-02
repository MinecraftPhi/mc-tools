import { combineLatest, isObservable, of, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

// Takes a type structure that may contain observables and produces a type with all observables removed
type ObjectOverservable<T> = {
    // Unwrap observables
    observable: T extends Observable<infer V> ? ObjectOverservable<V> : T,
    // Unwrap array values. Tuples are implicitly converted to arrays of unions, which is unavoidable without possible future extensions to the type system
    array: T extends Array<infer V> ? Array<ObjectOverservable<V>> : T,
    // Unwrap each value in the object
    object: 
        T extends {
            [key in keyof T]: T[key];
        }
        ? {
            [key in keyof T]: T[key] extends Observable<infer K>
                ? ObjectOverservable<K> : ObjectOverservable<T[key]>
        }
        : T,
    // Just use the plain value
    value: T
}[  // Annoying workaround needed to allow fully recursive type aliases
    T extends Observable<infer V>
    ? 'observable'
    :
        T extends Array<infer V>
        ? 'array'
        : T extends {
            [key in keyof T]: T[key];
        }
            ? 'object'
            : 'value'
];

// Ignore types internally as there is no way to map key: value pairs in a type safe way (that I have been able to find)
function internalCombineLatestRecursive(val: unknown) : Observable<unknown> {
    if(isObservable(val))
    {
        // Unwrap values produced by the observable
        return val.pipe(
            switchMap(i => internalCombineLatestRecursive(i))
        );
    }
    else if(Array.isArray(val))
    {
        // array of (possibly) observables -> observable of array
        return combineLatest(val.map(internalCombineLatestRecursive));
    }
    else if(typeof val === 'object')
    {
        // object of (possibly) observables -> observable of objects
        return combineLatest(
            Object.keys(val).map(key =>                             // For each key
                internalCombineLatestRecursive(val[key]).pipe(      // combine the value
                    map(v => {
                        return {                                    // And produce new key: value pairs
                            [key]: v
                        };
                    })
                )
            )
        ).pipe(map(p => Object.assign({}, ...p)))                   // Merge key: value pairs into single object
    }
    else
    {
        // Return observable of value for consistency
        return of(val);
    }
}

// Takes any input value and produces an observable with a copy of the latest state of any contained observables, continously on every change
// The original structure and types is maintained
export function combineLatestRecursive<T>(val: T) : Observable<ObjectOverservable<T>> {
    return internalCombineLatestRecursive(val) as Observable<ObjectOverservable<T>>;
}