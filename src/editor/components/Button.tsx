import React from "react";

const Button = (props: any) => {
  const { selected, onClick, value } = props;
  return <input className={"m-1 p-1 bg-cyan-300 border border-cyan-400 rounded" + (selected ? " bg-cyan-400 border-cyan-500" : "")} value={value} type="button" onClick={onClick} />;
}

export default Button;