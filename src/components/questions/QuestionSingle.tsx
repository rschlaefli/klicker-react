import React from 'react'
import { Icon } from 'semantic-ui-react'
import { injectIntl, IntlShape } from 'react-intl'
import { generateTypesShort } from '../../lib'

interface Props {
  intl: IntlShape
  onDelete?: () => void
  title: string
  totalParticipants?: number
  type: string
  version?: number
}

const defaultProps = {
  onDelete: undefined,
  totalParticipants: 0,
  version: 0,
}

function QuestionSingle({ type, intl, title, totalParticipants, version, onDelete }: Props): React.ReactElement {
  return (
    <div className="questionSingle">
      <div className="top">
        <div className="type">{generateTypesShort(intl)[type]}</div>

        {onDelete && (
          <button className="ui basic icon button deleteButton" type="button" onClick={onDelete}>
            <Icon name="trash" />
          </button>
        )}

        {totalParticipants > 0 && (
          <div className="responseCount">
            <Icon name="user outline" />
            {totalParticipants}
          </div>
        )}
      </div>

      <div className="title">
        {title} <span>{`(v${version + 1})`}</span>
      </div>

      <style jsx>
        {`
          @import 'src/theme';

          .questionSingle {
            border: 1px solid $color-primary !important;
            background-color: $color-primary-background;

            .top,
            .title {
              padding: 0.3rem;
            }

            .top {
              background-color: $color-primary-20p;
              display: flex;
              justify-content: space-between;
              text-align: center;

              .type {
                font-weight: bold;
              }

              .deleteButton {
                padding: 3px;
                margin: 0;
              }
            }

            .title {
              line-break: loose;
              text-align: center;
              color: $color-primary-strong;
            }
          }
        `}
      </style>
    </div>
  )
}

QuestionSingle.defaultProps = defaultProps

export default injectIntl(QuestionSingle)