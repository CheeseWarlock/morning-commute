import React from "react";

const Button = (props: any) => {
  const { selected, onClick, value, disabled } = props;
  return <input className={
    "cursor-pointer m-1 p-1 rounded border" +
    (disabled ? " bg-gray-200 border-gray-300 text-gray-500 cursor-not-allowed" : 
    (selected ? " bg-cyan-400 border-cyan-500" :
    " bg-cyan-200 border-cyan-300"))}
    value={value} type="button" onClick={onClick} disabled={disabled} />;
}

export default Button;