#!/usr/bin/env python3
"""
FastMCP Filesystem Server for Artifact File Operations

Provides direct file system access to the artifact AI for fast editing.
"""

import os
import sys
from pathlib import Path
from typing import Optional
from fastmcp import FastMCP

# Initialize FastMCP server
mcp = FastMCP("Artifact Filesystem")

# Base directory for artifact workspaces (relative to project root)
WORKSPACE_BASE = Path(__file__).parent.parent / "artifact_workspaces"
WORKSPACE_BASE.mkdir(exist_ok=True)


def get_workspace_path(artifact_id: str, file_path: str) -> Path:
    """
    Get full path to a file in an artifact workspace.

    Args:
        artifact_id: Unique identifier for the artifact
        file_path: Relative path within the artifact workspace

    Returns:
        Full absolute path to the file
    """
    workspace_dir = WORKSPACE_BASE / artifact_id
    workspace_dir.mkdir(exist_ok=True)

    # Normalize path and prevent directory traversal
    file_path = file_path.lstrip('/')
    full_path = (workspace_dir / file_path).resolve()

    # Security check: ensure path is within workspace
    if not str(full_path).startswith(str(workspace_dir)):
        raise ValueError("Path traversal detected - invalid file path")

    return full_path


@mcp.tool()
def read_file(artifact_id: str, path: str) -> str:
    """
    Read the contents of a file in the artifact workspace.

    Args:
        artifact_id: Unique identifier for the artifact
        path: Relative path to the file (e.g., "/app.py" or "components/Button.tsx")

    Returns:
        File contents as a string

    Example:
        read_file("artifact-123", "/app.py")
    """
    try:
        file_path = get_workspace_path(artifact_id, path)

        if not file_path.exists():
            return f"Error: File '{path}' does not exist"

        if not file_path.is_file():
            return f"Error: '{path}' is not a file"

        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        return content

    except Exception as e:
        return f"Error reading file: {str(e)}"


@mcp.tool()
def write_file(artifact_id: str, path: str, content: str) -> str:
    """
    Write content to a file in the artifact workspace. Creates the file if it doesn't exist.

    Args:
        artifact_id: Unique identifier for the artifact
        path: Relative path to the file (e.g., "/app.py")
        content: Content to write to the file

    Returns:
        Success message or error

    Example:
        write_file("artifact-123", "/app.py", "print('Hello')")
    """
    try:
        file_path = get_workspace_path(artifact_id, path)

        # Create parent directories if needed
        file_path.parent.mkdir(parents=True, exist_ok=True)

        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)

        return f"Successfully wrote {len(content)} characters to '{path}'"

    except Exception as e:
        return f"Error writing file: {str(e)}"


@mcp.tool()
def edit_file(artifact_id: str, path: str, old_text: str, new_text: str) -> str:
    """
    Edit a file by replacing old_text with new_text. Uses exact string matching.

    Args:
        artifact_id: Unique identifier for the artifact
        path: Relative path to the file
        old_text: Text to find and replace
        new_text: Text to replace with

    Returns:
        Success message with number of replacements, or error

    Example:
        edit_file("artifact-123", "/app.py", "count = 0", "count = 10")
    """
    try:
        file_path = get_workspace_path(artifact_id, path)

        if not file_path.exists():
            return f"Error: File '{path}' does not exist"

        # Read current content
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Check if old_text exists
        if old_text not in content:
            return f"Error: Could not find text to replace in '{path}'"

        # Replace text
        new_content = content.replace(old_text, new_text)
        count = content.count(old_text)

        # Write back
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)

        return f"Successfully replaced {count} occurrence(s) in '{path}'"

    except Exception as e:
        return f"Error editing file: {str(e)}"


@mcp.tool()
def delete_file(artifact_id: str, path: str) -> str:
    """
    Delete a file from the artifact workspace.

    Args:
        artifact_id: Unique identifier for the artifact
        path: Relative path to the file

    Returns:
        Success message or error

    Example:
        delete_file("artifact-123", "/old_file.py")
    """
    try:
        file_path = get_workspace_path(artifact_id, path)

        if not file_path.exists():
            return f"Error: File '{path}' does not exist"

        if not file_path.is_file():
            return f"Error: '{path}' is not a file"

        file_path.unlink()
        return f"Successfully deleted '{path}'"

    except Exception as e:
        return f"Error deleting file: {str(e)}"


@mcp.tool()
def list_files(artifact_id: str, directory: str = "/") -> str:
    """
    List all files in a directory of the artifact workspace.

    Args:
        artifact_id: Unique identifier for the artifact
        directory: Relative path to directory (default: "/")

    Returns:
        List of files and directories as a formatted string

    Example:
        list_files("artifact-123", "/components")
    """
    try:
        dir_path = get_workspace_path(artifact_id, directory)

        if not dir_path.exists():
            return f"Error: Directory '{directory}' does not exist"

        if not dir_path.is_dir():
            return f"Error: '{directory}' is not a directory"

        # List all files and directories
        items = []
        for item in sorted(dir_path.iterdir()):
            rel_path = item.relative_to(dir_path)
            if item.is_dir():
                items.append(f"📁 {rel_path}/")
            else:
                size = item.stat().st_size
                items.append(f"📄 {rel_path} ({size} bytes)")

        if not items:
            return f"Directory '{directory}' is empty"

        return "\n".join(items)

    except Exception as e:
        return f"Error listing files: {str(e)}"


@mcp.tool()
def create_directory(artifact_id: str, path: str) -> str:
    """
    Create a new directory in the artifact workspace.

    Args:
        artifact_id: Unique identifier for the artifact
        path: Relative path to the new directory

    Returns:
        Success message or error

    Example:
        create_directory("artifact-123", "/components")
    """
    try:
        dir_path = get_workspace_path(artifact_id, path)

        if dir_path.exists():
            return f"Error: Directory '{path}' already exists"

        dir_path.mkdir(parents=True, exist_ok=True)
        return f"Successfully created directory '{path}'"

    except Exception as e:
        return f"Error creating directory: {str(e)}"


if __name__ == "__main__":
    # Run the FastMCP server
    mcp.run()
