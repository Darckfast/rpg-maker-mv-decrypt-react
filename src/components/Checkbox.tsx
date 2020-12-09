import React, { ChangeEvent } from 'react'
import { ToggleLabel } from '../styles/pages/Home'

interface CheckBoxProps {
  label?: string
  value: boolean
  onChangeValue?: (e: ChangeEvent<HTMLInputElement>) => void
}

const CheckBox: React.FC<CheckBoxProps> = props => {
  return (
    <ToggleLabel>
      {props.label}
      <input
        type="checkbox"
        checked={props.value}
        onChange={props.onChangeValue}
      />
      <svg
        width="42"
        height="17"
        viewBox="0 0 42 17"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M8.5 16C4.35786 16 1 12.6421 1 8.5C1 4.35787 4.35786 1 8.5 1L33.001 1C37.1431 1 40.501 4.35787 40.501 8.5C40.501 12.6421 37.1431 16 33.001 16L8.5 16Z"
          stroke="#E1E1E6"
          strokeWidth="2"
        />
        <circle cx={props.value ? 32.5 : 8.5} cy="8.5" r="4.5" fill="#E1E1E6" />
      </svg>
    </ToggleLabel>
  )
}

export default CheckBox
