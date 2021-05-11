# -*- coding: utf-8 -*-

import click

from app import app, db
from app.models import *

@app.cli.command()
def test():
    click.echo("test!!")
    
    
