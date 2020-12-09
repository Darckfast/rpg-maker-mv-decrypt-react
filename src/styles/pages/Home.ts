import styled from 'styled-components'

export const Container = styled.div`
  width: 100vw;
  height: 100vh;

  display: flex;
  justify-content: center;
  align-items: center;
`

export const Button = styled.button`
  width: 6em;
  height: 3em;
  margin: 1em;
  cursor: pointer;
  font-size: 16px;

  background-color: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
  transition: 0.2s;
  border: 1px ${props => props.theme.colors.text} solid;
  outline: none;
  border-radius: 4px;

  &:hover {
    background-color: ${props => props.theme.colors.text};
    color: ${props => props.theme.colors.background};
  }

  &:disabled {
    background-color: ${props => props.theme.colors.disabled};
    color: ${props => props.theme.colors.background};
    cursor: auto;
  }
`

export const ProgressBar = styled.div`
  position: relative;
  height: 1.3em;
  width: 100%;
  border-radius: 0.5em;
  background-color: ${props => props.theme.colors.backgroundLight};
`

export const Filler = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;

  margin-top: 1em;
  background-color: ${props => props.theme.colors.secondary};
  height: 100%;
  width: 0em;
  border-radius: inherit;
  transition: width 0.2s ease-in;
`

export const ProgressStatus = styled.p`
  position: absolute;
  right: 0;
  margin-right: 1em;
`

export const InputLabel = styled.label`
  // font-size: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: 0.2s;

  margin: 1em;
  padding: 1em;
  border-radius: 4px;
  border: 1px ${props => props.theme.colors.text} solid;

  &:hover {
    background-color: ${props => props.theme.colors.text};
    color: ${props => props.theme.colors.background};
  }
`
export const ToggleLabel = styled.label`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin: 1em;

  input {
    display: none;
  }

  input:checked + svg {
    fill: #0ec63c;
  }

  svg {
    cursor: pointer;
    margin-left: 1em;
    transition: 0.2s;

    circle {
      transition: 0.2s;
    }
  }
`
