import React from 'react'
import ReactTooltip from 'react-tooltip'
import _get from 'lodash/get'
import { Form, Icon, Input } from 'semantic-ui-react'
import { FormattedMessage } from 'react-intl'
import { compose, withHandlers, mapProps } from 'recompose'

import { QUESTION_TYPES } from '../../../constants'

interface Props {
  dirty: boolean
  disabled?: boolean
  handleMaxChange: (value: any) => void
  handleMinChange: (value: any) => void
  invalid: boolean
  max?: number
  min?: number
  type: string
}

const defaultProps = {
  disabled: false,
  max: undefined,
  min: undefined,
}

function FREECreationOptions({
  disabled,
  max,
  min,
  type,
  handleMaxChange,
  handleMinChange,
  dirty,
  invalid,
}: Props): React.ReactElement {
  return (
    <div className="FREECreationOptions">
      {type === QUESTION_TYPES.FREE_RANGE && (
        <Form.Field required error={dirty && invalid}>
          <label htmlFor="options">
            <FormattedMessage defaultMessage="Input Restrictions" id="createQuestion.optionsFREE.label" />
            <a data-tip data-for="FREECreationHelp">
              <Icon name="question circle" />
            </a>
          </label>

          <ReactTooltip delayHide={250} delayShow={250} id="FREECreationHelp" place="right">
            <FormattedMessage
              defaultMessage="Choose the allowed format of incoming responses."
              id="createQuestion.optionsFREE.tooltip"
            />
          </ReactTooltip>

          {/* type === QUESTION_TYPES.FREE && <div>Unrestricted input.</div> */}

          <div className="range">
            <Form.Field>
              <label htmlFor="min">
                <FormattedMessage defaultMessage="Min" id="createQuestion.options.min" />
              </label>
              <Input
                disabled={disabled}
                name="min"
                placeholder="-∞"
                type="number"
                value={min}
                onChange={handleMinChange}
              />
            </Form.Field>

            <Form.Field>
              <label htmlFor="max">
                <FormattedMessage defaultMessage="Max" id="createQuestion.options.max" />
              </label>
              <Input
                disabled={disabled}
                name="max"
                placeholder="∞"
                type="number"
                value={max}
                onChange={handleMaxChange}
              />
            </Form.Field>
          </div>
        </Form.Field>
      )}

      <style jsx>
        {`
          @import 'src/theme';

          .FREECreationOptions {
            @include tooltip-icon;

            .optionsChooser {
              display: flex;

              > :global(*):not(:last-child) {
                margin-right: 1rem;
              }
            }

            .range {
              display: flex;
              flex-direction: column;

              margin-top: 1rem;

              :global(.field) > label {
                font-size: 1rem;
              }

              @include desktop-tablet-only {
                flex-direction: row;

                :global(.field) {
                  width: 10rem;

                  &:not(:last-child) {
                    margin-right: 1rem;
                  }
                }
              }
            }
          }
        `}
      </style>
    </div>
  )
}

FREECreationOptions.defaultProps = defaultProps

export default compose(
  mapProps(({ disabled, onChange, value, dirty, invalid, type }) => ({
    dirty,
    disabled,
    invalid,
    max: _get(value, 'restrictions.max'),
    min: _get(value, 'restrictions.min'),
    onChange,
    type,
    value,
  })),
  withHandlers({
    // handle a change in the maximum allowed numerical value
    handleMaxChange: ({ onChange, value }) => e => {
      const max = e.target.value === '' ? null : +e.target.value
      onChange({
        ...value,
        restrictions: { ...value.restrictions, max },
      })
    },

    // handle a change in the minimum allowed numerical value
    handleMinChange: ({ onChange, value }) => e => {
      const min = e.target.value === '' ? null : +e.target.value
      onChange({
        ...value,
        restrictions: { ...value.restrictions, min },
      })
    },
  })
)(FREECreationOptions)