import React, { useState } from 'react';
import {
  Form,
  FormControl,
  TextInput,
  Button,
  AssetCard,
  MenuItem,
} from '@contentful/f36-components';
import { FieldExtensionSDK } from '@contentful/app-sdk';
import { useAutoResizer, useCMA, useSDK } from '@contentful/react-apps-toolkit';

export interface Movie {
  name: string;
  image: string;
  description: string;
}

const Field = () => {
  const sdk = useSDK<FieldExtensionSDK>();
  const cma = useCMA();
  useAutoResizer();
  const [movieSearch, setMovieSearch] = useState<string>('');
  const [movieData, setMovieData] = useState<Movie | null>();
  const titleField = sdk.entry.fields.title;
  const descriptionField = sdk.entry.fields.description;
  const posterField = sdk.entry.fields.poster;

  const openDialog = async () => {
    const { sys } = await cma.space.get({});
    const { id } = sys;
    const movie = await sdk.dialogs.openCurrentApp({
      width: 700,
      parameters: {
        movieName: movieSearch,
      },
      title: 'Movie Search Results',
      allowHeightOverflow: true,
      shouldCloseOnEscapePress: true,
      shouldCloseOnOverlayClick: true,
    });
    if (movie) {
      setMovieSearch('')
      setMovieData(movie);
      titleField.setValue(movie.name)
      descriptionField.setValue(movie.description)
      const linkAsset = await cma.asset.create(
        { spaceId: id },
        {
          fields: {
            title: {
              'en-US': movie.name
            },
            description: {
              'en-US': `Poster of ${movie.name}`
            },
            file: {
              'en-US': {
                contentType: 'image/jpg',
                fileName: movie.name,
                upload: movie.image
              }
            }
          }
        })
      const processImage = await cma.asset.processForAllLocales({ spaceId: id }, linkAsset)
      const publishImage = await cma.asset.publish({ assetId: processImage.sys.id }, processImage)
      await posterField.setValue({
        sys: {
          id: publishImage.sys.id,
          linkType: 'Asset',
          type: 'Link'
        }
      }, 'en-US')
    }
  };


  if (movieData === null) {
    return (
      <Form onSubmit={() => openDialog()}>
        <FormControl>
          <FormControl.Label isRequired>Movie Name</FormControl.Label>

          <TextInput type="text" onChange={(e) => setMovieSearch(e.target.value)} isRequired />
        </FormControl>
        <FormControl>
          <Button type="submit" variant="primary">
            Search
          </Button>
        </FormControl>
      </Form>
    )
  }
  else {
    return (
      <>
        <Button type="submit" variant="primary" onClick={() => {
          titleField.removeValue()
          descriptionField.removeValue()
          posterField.removeValue()
          setMovieData(null)
        }}>
          New Search
        </Button>
      </>
    )
  }
};

export default Field;
