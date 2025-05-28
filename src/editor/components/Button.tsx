import React from "react";

const Button = (props: any) => {
  const { selected, onClick, value, disabled } = props;
  return <input className={
    "m-1 px-3 p-1 rounded border font-mono font-bold text-white shadow-md" +
    (disabled ? " bg-zinc-200 border-zinc-300 text-zinc-500 cursor-not-allowed" : 
    (selected ? " cursor-pointer bg-indigo-700 border-indigo-800" :
    " cursor-pointer bg-indigo-500 border-indigo-800"))}
    value={value} type="button" onClick={onClick} disabled={disabled} />;
}

export default Button;