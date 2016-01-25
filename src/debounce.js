export default function debounce(func, wait, immediate) {
  var timeout, args, context, timestamp, result;

  function now() { new Date().getTime(); }

  var later = () => {
    var last = now() - timestamp;
    if (last < wait) {
      timeout = setTimeout(later, wait - last);
    } else {
      timeout = null;
      if (!immediate) {
        result = func.apply(context, args);
        context = args = null;
      }
    }
  };

  return () => {
    args = arguments;
    timestamp = now();
    const callNow = immediate && !timeout;
    if (!timeout) timeout = setTimeout(later, wait);
    if (callNow) {
      result = func.apply(this, args);
      context = args = null;
    }

    return result;
  };
}
