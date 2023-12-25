import { useNuiEvent } from '../../../hooks/useNuiEvent';
import { Box, createStyles, Flex, Stack, Text, TextInput } from '@mantine/core';
import { useEffect, useState } from 'react';
import { ContextMenuProps } from '../../../typings';
import ContextButton from './components/ContextButton';
import { fetchNui } from '../../../utils/fetchNui';
import ReactMarkdown from 'react-markdown';
import HeaderButton from './components/HeaderButton';
import ScaleFade from '../../../transitions/ScaleFade';
import MarkdownComponents from '../../../config/MarkdownComponents';

const openMenu = (id: string | undefined) => {
  fetchNui<ContextMenuProps>('openContext', { id: id, back: true });
};

const useStyles = createStyles((theme) => ({
  container: {
    position: 'absolute',
    top: '15%',
    right: '25%',
    width: 320,
    height: 580,
  },
  header: {
    marginBottom: 10,
    gap: 3,
    flexDirection: 'column',
  },
  headerRowWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 3,
  },
  titleContainer: {
    borderRadius: 4,
    flex: '1 85%',
    backgroundColor: theme.colors.dark[6],
  },
  titleText: {
    color: theme.colors.dark[0],
    padding: 6,
    textAlign: 'center',
  },
  buttonsContainer: {
    height: 560,
    overflowY: 'scroll',
  },
  buttonsFlexWrapper: {
    gap: 3,
  },
}));

const ContextMenu: React.FC = () => {
  const { classes } = useStyles();
  const [visible, setVisible] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuProps>({
    title: '',
    options: { '': { description: '', metadata: [] } },
  });
  const [searchFieldInput, setSearchFieldInput] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(contextMenu.options);
  const [filterTimeout, setFilterTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const closeContext = () => {
    if (contextMenu.canClose === false) return;
    setVisible(false);
    fetchNui('closeContext');
  };

  useEffect(() => {
    if (filterTimeout !== null) {
      clearTimeout(filterTimeout);
    }

    const timeout = setTimeout(() => {
      const filtered = Object.entries(contextMenu.options).filter((option) => {
        if (option[1].title && option[1].title.toLowerCase().includes(searchFieldInput.toLowerCase())) {
          return true;
        }
        if (option[1].description && option[1].description.toLowerCase().includes(searchFieldInput.toLowerCase())) {
          return true;
        }
        return false;
      });
      setFilteredOptions(Object.fromEntries(filtered));
    }, 500);

    setFilterTimeout(timeout);

    return () => {
      if (filterTimeout !== null) {
        clearTimeout(filterTimeout);
      }
    };
  }, [searchFieldInput]);

  // Hides the context menu on ESC
  useEffect(() => {
    if (!visible) return;

    const keyHandler = (e: KeyboardEvent) => {
      if (['Escape'].includes(e.code)) closeContext();
    };

    window.addEventListener('keydown', keyHandler);

    return () => window.removeEventListener('keydown', keyHandler);
  }, [visible]);

  useNuiEvent('hideContext', () => setVisible(false));

  useNuiEvent<ContextMenuProps>('showContext', async (data) => {
    if (visible) {
      setVisible(false);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    setContextMenu(data);
    setVisible(true);
  });

  return (
    <Box className={classes.container}>
      <ScaleFade visible={visible}>
        <Flex className={classes.header}>
          <Flex className={classes.headerRowWrapper}>
            {contextMenu.menu && (
              <HeaderButton icon="chevron-left" iconSize={16} handleClick={() => openMenu(contextMenu.menu)} />
            )}
            <Box className={classes.titleContainer}>
              <Text className={classes.titleText}>
                <ReactMarkdown components={MarkdownComponents}>{contextMenu.title}</ReactMarkdown>
              </Text>
            </Box>
            <HeaderButton icon="xmark" canClose={contextMenu.canClose} iconSize={18} handleClick={closeContext} />
          </Flex>
          <TextInput placeholder="Search" onChange={(e) => setSearchFieldInput(e.target.value)} />
        </Flex>
        <Box className={classes.buttonsContainer}>
          <Stack className={classes.buttonsFlexWrapper}>
            {Object.entries(filteredOptions).map((option, index) => (
              <ContextButton option={option} key={`context-item-${index}`} />
            ))}
          </Stack>
        </Box>
      </ScaleFade>
    </Box>
  );
};

export default ContextMenu;
