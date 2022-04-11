import {
  Checkbox,
  FormControl,
  Grid,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  SelectChangeEvent,
  TextField,
} from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { JsonPayloadContext } from '../../contexts/JsonPayloadContext';
import { DEFAULT_SPACING } from '../../theme';
import {
  DEFAULT_MESSAGE_STRING,
  MessageTypeGroup,
} from '../Buttons/MessageTypeGroup';

interface NetworkIdentity {
  did: string;
  id: string;
  name: string;
}

export const PrivateForm: React.FC = () => {
  const { jsonPayload, setJsonPayload, activeForm } =
    useContext(JsonPayloadContext);
  const { t } = useTranslation();
  const [message, setMessage] = useState<string | object>(
    DEFAULT_MESSAGE_STRING
  );
  const [identities, setIdentities] = useState<NetworkIdentity[]>([]);
  const [recipients, setRecipients] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>('');

  const [tag, setTag] = useState<string>();
  const [topics, setTopics] = useState<string>();

  useEffect(() => {
    fetch(`/api/common/organizations?exclude_self=false`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        setIdentities(data);
      })
      .catch(() => {
        return null;
      });
  }, []);

  useEffect(() => {
    if (!activeForm.includes('private')) {
      return;
    }
    setJsonPayload({
      topic: topics,
      tag,
      value: message,
      filename: fileName,
      recipients,
    });
  }, [message, recipients, tag, topics, fileName, activeForm]);

  const handleRecipientChange = (
    event: SelectChangeEvent<typeof recipients>
  ) => {
    const {
      target: { value },
    } = event;
    setRecipients(typeof value === 'string' ? value.split(',') : value);
  };

  const handleTagChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.value.length === 0) {
      setTag(undefined);
      return;
    }
    setTag(event.target.value);
  };

  const handleTopicsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.value.length === 0) {
      setTopics(undefined);
      return;
    }
    setTopics(event.target.value);
  };

  return (
    <Grid container>
      <Grid container spacing={DEFAULT_SPACING}>
        {/* Message */}
        <MessageTypeGroup
          noUndefined
          message={message}
          onSetMessage={(msg: string | object) => setMessage(msg)}
          onSetFileName={(file: string) => {
            setFileName(file);
          }}
        />
        <Grid container item justifyContent="space-between" spacing={1}>
          {/* Tag */}
          <Grid item xs={6}>
            <TextField
              fullWidth
              label={t('tag')}
              placeholder={t('exampleTag')}
              onChange={handleTagChange}
            />
          </Grid>
          {/* Topic */}
          <Grid item xs={6}>
            <TextField
              fullWidth
              label={t('topic')}
              placeholder={t('exampleTopic')}
              onChange={handleTopicsChange}
            />
          </Grid>
        </Grid>
        <Grid container item>
          {/* Recipient Select box */}
          <FormControl fullWidth required>
            <InputLabel>{t('recipients')}</InputLabel>
            <Select
              multiple
              value={recipients}
              onChange={handleRecipientChange}
              input={<OutlinedInput label={t('recipients')} />}
              renderValue={(selected) => selected.join(', ')}
            >
              {identities.map((identity, idx) => (
                <MenuItem key={idx} value={identity.did}>
                  <Checkbox checked={recipients.indexOf(identity.did) > -1} />
                  <ListItemText primary={identity.did} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </Grid>
  );
};
