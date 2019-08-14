import React from 'react'
import Link from 'next/link'
import { defineMessages, FormattedMessage, useIntl } from 'react-intl'
import { Button, Confirm, Icon } from 'semantic-ui-react'

const messages = defineMessages({
  deletionConfirmationCancel: {
    defaultMessage: 'Cancel',
    id: 'questionPool.button.deletionConfirmationCancel',
  },
  deletionConfirmationConfirm: {
    defaultMessage: 'Delete {num} question(s)!',
    id: 'questionPool.button.deletionConfirmationConfirm',
  },
  deletionConfirmationContent: {
    defaultMessage:
      'Are you sure you want to delete the {num} selected questions? Consider moving them to the archive if you could have use for them in the future.',
    id: 'questionPool.string.deletionConfirmationContent',
  },
})

interface Props {
  creationMode?: boolean
  deletionConfirmation: boolean
  handleArchiveQuestions: any
  handleCreationModeToggle: any
  handleDeleteQuestions: any
  handleQuickBlock: any
  handleQuickBlocks: any
  isArchiveActive?: boolean
  itemsChecked?: number
}

const defaultProps = {
  creationMode: false,
  isArchiveActive: false,
  itemsChecked: 0,
}

function ActionBar({
  isArchiveActive,
  creationMode,
  deletionConfirmation,
  itemsChecked,
  handleArchiveQuestions,
  handleCreationModeToggle,
  handleDeleteQuestions,
  handleQuickBlock,
  handleQuickBlocks,
}: Props): React.ReactElement {
  const intl = useIntl()
  return (
    <div className="actionBar">
      <div className="actionButtons">
        <Link href="/questions/create">
          <Button primary>
            <FormattedMessage defaultMessage="Create Question" id="questionPool.button.createQuestion" />
          </Button>
        </Link>

        <Button primary disabled={!!creationMode} onClick={handleCreationModeToggle}>
          <FormattedMessage defaultMessage="Create Session" id="questionPool.button.createSession" />
        </Button>
      </div>

      <div className="creationButtons">
        {creationMode ? (
          <>
            <Button icon disabled={itemsChecked === 0} labelPosition="left" onClick={(): void => handleQuickBlocks()}>
              <Icon name="lightning" />
              <FormattedMessage
                defaultMessage="Split questions into {num} blocks"
                id="questionPool.button.quickCreateSeparate"
                values={{ num: +itemsChecked }}
              />
            </Button>

            <Button icon disabled={itemsChecked === 0} labelPosition="left" onClick={(): void => handleQuickBlock()}>
              <Icon name="lightning" />
              <FormattedMessage
                defaultMessage="Group questions into one block ({num}->1)"
                id="questionPool.button.quickCreateSingle"
                values={{ num: +itemsChecked }}
              />
            </Button>
          </>
        ) : (
          <>
            <Button
              icon
              disabled={itemsChecked === 0}
              labelPosition="left"
              onClick={(): void => handleArchiveQuestions()}
            >
              <Icon name="archive" />
              {isArchiveActive ? (
                <FormattedMessage
                  defaultMessage="Unarchive questions ({num})"
                  id="questionPool.button.unarchiveQuestions"
                  values={{ num: +itemsChecked }}
                />
              ) : (
                <FormattedMessage
                  defaultMessage="Archive questions ({num})"
                  id="questionPool.button.archiveQuestions"
                  values={{ num: +itemsChecked }}
                />
              )}
            </Button>
            <Button
              icon
              color="red"
              disabled={itemsChecked === 0}
              labelPosition="left"
              onClick={(): void => handleDeleteQuestions(false)}
            >
              <Icon name="trash" />
              <FormattedMessage
                defaultMessage="Delete questions ({num})"
                id="questionPool.button.deleteQuestions"
                values={{ num: +itemsChecked }}
              />
            </Button>
            <Confirm
              cancelButton={intl.formatMessage(messages.deletionConfirmationCancel)}
              confirmButton={intl.formatMessage(messages.deletionConfirmationConfirm, { num: +itemsChecked })}
              content={intl.formatMessage(messages.deletionConfirmationContent, { num: +itemsChecked })}
              open={deletionConfirmation}
              onCancel={(): void => handleDeleteQuestions(false)}
              onConfirm={(): void => handleDeleteQuestions(true)}
            />
          </>
        )}
      </div>

      <div className="checkedCounter">
        <FormattedMessage
          defaultMessage="{count} items checked"
          id="questionPool.string.itemsChecked"
          values={{
            count: +itemsChecked,
          }}
        />
      </div>

      <style jsx>
        {`
          @import 'src/theme';

          .actionBar,
          .actionButtons,
          .creationButtons {
            display: flex;
            flex-direction: column;
          }

          .actionBar {
            background-color: $color-primary-05p;
            border: 1px solid $color-primary;
            padding: 0.5rem;

            .actionButtons,
            .creationButtons {
              flex: 1;
            }

            @include desktop-tablet-only {
              flex-direction: row;
              align-items: center;
              justify-content: space-between;

              .creationButtons,
              .actionButtons {
                flex: 0 0 auto;
                flex-direction: row;

                > :global(button:last-child) {
                  margin-right: 0;
                }
              }

              .checkedCounter {
                color: grey;
                order: 1;

                padding-left: 1rem;
              }

              .creationButtons {
                order: 2;
              }

              .actionButtons {
                order: 3;
              }
            }
          }
        `}
      </style>
    </div>
  )
}

ActionBar.defaultProps = defaultProps

export default ActionBar