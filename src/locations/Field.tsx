import React, { useState } from 'react';
import {
  Form,
  FormControl,
  TextInput,
  Button,
} from '@contentful/f36-components';
import { FieldExtensionSDK } from '@contentful/app-sdk';
import { useAutoResizer, useCMA, useSDK } from '@contentful/react-apps-toolkit';

export interface Movie {
  id?: string;
  name: string;
  image: string;
  description?: string;
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
    let existingEntries: Movie[] | null = []
    const entry = await cma.entry.getMany({
      query: {
        content_type: 'movies',
        'fields.title[match]': movieSearch,
      }
    })
    if (entry.items.length !== 0) {
      for (let movie of entry.items) {
        let asset = await cma.asset.get({
          assetId: movie.fields.poster["en-US"].sys.id
        })
        existingEntries.push({
          id: movie.sys.id,
          name: movie.fields.title["en-US"],
          image: `http:${asset.fields.file["en-US"].url}`
        })
      }
    }
    const movie = await sdk.dialogs.openCurrentApp({
      width: 700,
      // @ts-expect-error
      parameters: {
        movieName: movieSearch,
        existingEntries: existingEntries
      },
      title: 'Movie Search Results',
      allowHeightOverflow: true,
      shouldCloseOnEscapePress: true,
      shouldCloseOnOverlayClick: true,
    });
    if ("name" in movie) {
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
    else {
      cma.entry.delete({ entryId: sdk.ids.entry })
      sdk.navigator.openEntry(movie.entryId);
    }
  };


  if (!titleField.getValue() && !movieData) {
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