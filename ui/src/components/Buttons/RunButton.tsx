import { ArrowForwardIos } from '@mui/icons-material';
import {
  Alert,
  Button,
  CircularProgress,
  Grid,
  Snackbar,
  Typography,
  useTheme,
} from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { setDumbAwaitedEventId } from '../../AppWrapper';
import {
  TUTORIAL_CATEGORIES,
  TUTORIAL_FORMS,
} from '../../constants/TutorialSections';
import { ApplicationContext } from '../../contexts/ApplicationContext';
import { EventContext } from '../../contexts/EventContext';
import { FormContext } from '../../contexts/FormContext';
import { DEFAULT_BORDER_RADIUS } from '../../theme';
import { isSuccessfulResponse } from '../../utils/strings';

interface Props {
  endpoint: string;
  payload: any;
  disabled?: boolean;
}

export const RunButton: React.FC<Props> = ({ endpoint, payload, disabled }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [showSnackbar, setShowSnackbar] = useState(false);
  const { setApiStatus, setApiResponse, payloadMissingFields } =
    useContext(ApplicationContext);
  const {
    addAwaitedEventID,
    dumbAwaitedEventID,
    justSubmitted,
    setJustSubmitted,
  } = useContext(EventContext);
  const { formID, categoryID, isBlob } = useContext(FormContext);

  useEffect(() => {
    setJustSubmitted(false);
    setDumbAwaitedEventId(undefined);
  }, [formID]);

  useEffect(() => {
    setJustSubmitted(false);
  }, [dumbAwaitedEventID]);

  const handleCloseSnackbar = (_: any, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setShowSnackbar(false);
  };

  const handlePost = () => {
    setApiStatus(undefined);
    setApiResponse({});
    managePayload();
    const postEndpoint = isBlob ? endpoint + 'blob' : endpoint;
    const reqDetails: any = {
      method: 'POST',
      body: isBlob
        ? buildFormData(payload, postEndpoint)
        : JSON.stringify(payload),
    };
    if (!isBlob) {
      reqDetails.headers = { 'Content-Type': 'application/json' };
    }
    fetch(postEndpoint, reqDetails)
      .then((response) => {
        setApiStatus({
          status: response.status,
          statusText: response.statusText,
        });
        return Promise.all([response, response.json()]);
      })
      .then((result) => {
        const [response, data] = result;
        setShowSnackbar(true);
        setApiResponse(data);
        if (response.status === 202) {
          setJustSubmitted(true);
          addAwaitedEventID(data);
        } else if (!isSuccessfulResponse(response.status)) {
          setJustSubmitted(false);
          setDumbAwaitedEventId(undefined);
        }
      })
      .catch((err) => {
        setShowSnackbar(true);
        setApiResponse(err);
      });
  };

  const managePayload = () => {
    if (!isBlob) {
      delete payload['filename'];
    }
    if (categoryID === TUTORIAL_CATEGORIES.TOKENS) {
      delete payload['message'];
    }
  };

  const buildFormData = (payload: any, blobEndpoint: string) => {
    const data = new FormData();
    const file: any = document.querySelector('input[type="file"]');
    data.append('file', file.files[0]);
    data.append('tag', payload.tag);
    data.append('topic', payload.topic);
    if (isTokenOperation(blobEndpoint)) {
      data.append('pool', payload.pool);
      data.append('amount', payload.amount ?? '0');
      data.append('tokenIndex', payload.tokenIndex ?? '');
      data.append('to', payload.to);
    }
    if (
      blobEndpoint.includes('privateblob') ||
      payload.messagingMethod === TUTORIAL_FORMS.PRIVATE
    ) {
      for (const r of payload.recipients) {
        data.append('recipients[]', r);
      }
    }
    return data;
  };

  const isTokenOperation = (blobEndpoint: string) => {
    return (
      blobEndpoint.includes(TUTORIAL_FORMS.MINT) ||
      blobEndpoint.includes(TUTORIAL_FORMS.TRANSFER) ||
      blobEndpoint.includes(TUTORIAL_FORMS.BURN)
    );
  };

  return (
    <>
      {dumbAwaitedEventID || justSubmitted ? (
        <Grid container alignItems={'center'}>
          <Typography sx={{ fontSize: '14px' }} pr={1}>
            {t('waitingForTxEventsToFinish')}
          </Typography>
          <CircularProgress size={20} color="warning" />
        </Grid>
      ) : (
        <>
          <Button
            endIcon={<ArrowForwardIos />}
            variant="contained"
            disabled={disabled || payloadMissingFields}
            sx={{
              borderRadius: DEFAULT_BORDER_RADIUS,
              backgroundColor: theme.palette.success.main,
            }}
            onClick={handlePost}
            size="small"
          >
            <Typography sx={{ textTransform: 'none' }}>{t('run')}</Typography>
          </Button>
          <Snackbar
            open={showSnackbar}
            autoHideDuration={6000}
            onClose={handleCloseSnackbar}
          >
            <Alert
              onClose={handleCloseSnackbar}
              severity={'success'}
              sx={{ width: '100%' }}
              variant={'filled'}
            >
              {`${t('postSentTo')}${endpoint}`}
            </Alert>
          </Snackbar>
        </>
      )}
    </>
  );
};
