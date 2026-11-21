function findBig(arr) {
  let biggest = arr[0];
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] > biggest) {
      biggest = arr[i];
    }
  }
  return biggest;
}

console.log(findBig([3, 7, 2])); // 7
console.log(findBig([10, 5, 15, 1])); // 15 
 


function addAll(arr){
  let total = 0;
  for(let i=0;i<arr.length;i++){
    total = total + arr[i];
  }
  return total;
}
console.log(addAll([1,2,3,4]));
// A) 4 B) 10 C) 24


function findSmall(arr) {
  let smallest = arr[0];
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] < smallest) {
      smallest = arr[i];
    }
  }
  return smallest;
}

console.log(findSmall([3, 7, 2])); // 2
console.log(findSmall([10, 5, 15, 1])); // 1


function addAll(arr) {
  let total = 0; // empty bowl
  for (let i = 0; i < arr.length; i++) {
    total = total + arr[i]; // add one by one
  }
  return total;
}

console.log(addAll([2, 3, 4])); // 9
console.log(addAll([10, 20, 30])); // 60
console.log(addAll([1, 1, 1, 1])); // 4


function countBig(arr) {
  let count = 0; // empty bowl for count
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] > 5) {
      count = count + 1; // see big one, add 1 for count
    }
  }
  return count;
}
console.log(countBig([2,6,3,8,1])); // 2