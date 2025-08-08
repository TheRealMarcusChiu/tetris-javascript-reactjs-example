import React, { useEffect, useCallback } from 'react';

window.addEventListener("keydown", function(e) {
  if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(e.code) > -1) {
    e.preventDefault(); // Prevent the default action (e.g., scrolling)
  }
}, false);

function GlobalKeyListener({ keydownEC, keyupEC }) {
  const handleGlobalKeyPressKeydown = useCallback((event) => { keydownEC(event) }, []);
  const handleGlobalKeyPressKeyup   = useCallback((event) => { keyupEC(event) }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleGlobalKeyPressKeydown);
    document.addEventListener('keyup', handleGlobalKeyPressKeyup);

    // Clean up the event listener when the component unmounts
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyPressKeydown);
      document.removeEventListener('keyup', handleGlobalKeyPressKeyup);
    };
  }, [handleGlobalKeyPressKeydown, handleGlobalKeyPressKeyup]);
  // Dependency array ensures the effect runs only when handleGlobalKeyPress changes

  return (<></>);
}

export default GlobalKeyListener